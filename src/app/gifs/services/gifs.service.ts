import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { environment } from '@environments/environment';
import { GiphyResponse } from '../interfaces/giphy.interface';
import { Gif } from '../interfaces/gif.interface';
import { GifMapper } from '../mapper/gif.mapper';
import { map, tap } from 'rxjs';

@Injectable({providedIn: 'root'})
export class GifService {

  private http = inject(HttpClient);

  trendingGifs = signal<Gif[]>([]);

  trendingGifsLoading = signal(true);

  searchHistory = signal<Record<string,Gif[]>>({});
  searchHistoryKeys = computed( () => Object.keys(this.searchHistory() ));

  constructor(){
    this.loadTrendingGifs();
  }

  loadTrendingGifs(){

    this.http.get<GiphyResponse>(`${environment.giphyUrl}/gifs/trending`,{
      params: {
        api_key: environment.giphyApiKey,
        limit: 20,
      },
    }).subscribe( (respuesta) => {

      const gifs = GifMapper.mapGiphyItemsToGifArray(respuesta.data);
      this.trendingGifs.set(gifs);
      this.trendingGifsLoading.set(false);
      console.log(gifs);

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
