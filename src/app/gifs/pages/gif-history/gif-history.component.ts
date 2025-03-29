import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop'
import { map } from 'rxjs';
import { GifService } from '../../services/gifs.service';
import { GifListComponent } from "../../components/gif-list/gif-list.component";

@Component({
  selector: 'gif-history',
  imports: [GifListComponent],
  templateUrl: './gif-history.component.html',
})
export default class GifHistoryComponent {

  gifService = inject(GifService);

  //Convierte en señal el observable de las URIs
  query = toSignal(
    inject(ActivatedRoute).params
    .pipe( map( (params) => params['query'] ) )
  );

  gifsByKey = computed( () => this.gifService.getHistoryGifs(this.query()));

 }
