import { EventEmitter, Injectable } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, catchError, tap } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';
import { ConfigLoaderService } from './config-loader.service';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  apiurl : string="";
  invokeRefreshMethod = new EventEmitter();
  constructor(private http: HttpClient,private configService: ConfigLoaderService) {   
    this.apiurl = this.configService.apiurl;    
  }
  getBalance(): Observable<[]> {
    const headerDict = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };
    return this.http.get<[]>(this.apiurl + 'balance').pipe(map((res :any) => res));  
  }
  getStatus(){
    const headerDict = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };
    return this.http.get<[]>(this.apiurl + 'status', requestOptions).pipe(map((res :any) => res));
  }
  //handle refresh event
  callRefreshMethod(params: any = 'refresh') {
    this.invokeRefreshMethod.emit(params);
  }
}
  // getBalance() {
  //   return this.http.get('../assets/data/ledgerdata.json').pipe(map((res :any) => res));
  // }
  // getStatus() {
  //   return this.http.get('../assets/data/ledgerdata.json').pipe(map((res :any) => res));
  // }
//}
