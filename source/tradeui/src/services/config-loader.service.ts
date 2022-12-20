import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class ConfigLoaderService {

public apiurl = '';

  constructor(private httpClient: HttpClient) { }

  initialize() {
    return this.httpClient.get('./assets/prodconfig.json').pipe(map((res :any) =>
    {
        this.apiurl = res.apiendpointurl;
    } ));
  }

}