import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { environment } from '@environments/environment';
import { GiphyResponse } from '../interfaces/giphy.interface';
import { Gif } from '../interfaces/gif.interface';
import { GifMapper } from '../mapper/gif.mapper';
import { map, tap } from 'rxjs';

const loadFromLocalStorage = (): Record<string,Gif[]> => {
  const historial = localStorage.getItem('historial') ?? '{}';
  return JSON.parse(historial);
}

@Injectable({providedIn: 'root'})
export class GifService {

  private http = inject(HttpClient);

  trendingGifs = signal<Gif[]>([]);
  trendingGifsLoading = signal(false);
  trendingPage = signal(0);

  trendingGifGroup = computed<Gif[][]>(() => {
    const groups = [];
    for( let i = 0; i < this.trendingGifs().length; i +=3 ){
      groups.push(this.trendingGifs().slice(i, i + 3));
    }
    return groups;
  });

  searchHistory = signal<Record<string,Gif[]>>(loadFromLocalStorage());
  searchHistoryKeys = computed( () => Object.keys(this.searchHistory() ));

  constructor(){
    this.loadTrendingGifs();
  }

  saveGifsToLocalStorage = effect(() => {
    localStorage.setItem('historial', JSON.stringify(this.searchHistory()));
  });

  loadTrendingGifs(){

    if ( this.trendingGifsLoading() ) return;

    this.trendingGifsLoading.set(true);

    this.http.get<GiphyResponse>(`${environment.giphyUrl}/gifs/trending`,{
      params: {
        api_key: environment.giphyApiKey,
        limit: 20,
        offset: this.trendingPage() * 20,
      },
    }).subscribe( (respuesta) => {

      const gifs = GifMapper.mapGiphyItemsToGifArray(respuesta.data);
      this.trendingGifs.update((currentGifs) => [... currentGifs, ... gifs]);
      this.trendingPage.update( (page) => page + 1 );
      this.trendingGifsLoading.set(false);
    } );

  }

  //https://api.giphy.com/v1/gifs/search?api_key=NNDYiGi74UNaqwkgHIApTqZyvycQtSpO&q=dragon+ball&limit=25&offset=0&rating=g&lang=en&bundle=messaging_non_clips
  searchGifs( query: string ){

    return this.http.get<GiphyResponse>(`${environment.giphyUrl}/gifs/search`,{
      params: {
        api_key: environment.giphyApiKey,
        q: query,
        limit: 20
      }
    })
    .pipe(
      map( ({ data }) => GifMapper.mapGiphyItemsToGifArray(data) ),
      tap( (items) => {
        this.searchHistory.update( (history) => ({
          ... history,
          [query.toLowerCase()]: items,
        }) )
      } ),
    );
  }

  getHistoryGifs(query: string):Gif[]{
    return this.searchHistory()[query] ?? [];
  }

}
