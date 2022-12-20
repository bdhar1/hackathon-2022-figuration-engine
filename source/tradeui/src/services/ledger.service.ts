import { EventEmitter, Injectable } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { ConfigLoaderService } from './config-loader.service';


@Injectable({
  providedIn: 'root'
})
export class LedgerService {
  apiurl : string ="";
  invokeRefreshMethod = new EventEmitter();
  constructor(private http: HttpClient,private configService: ConfigLoaderService) {     
this.apiurl = this.configService.apiurl;
  //   this.getJSON().subscribe(data => {
  //     this.apiurl =data.apiendpointurl;
  //     //console.log(this.apiurl)
  // });
   
  } 
//   public getJSON(): Observable<any> {
//     return this.http.get("./assets/prodconfig.json");
// }
    getCustomerDetails(customerName : string): Observable<[]> {
    const headerDict = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };
    let ledgerurl = this.apiurl + 'ledger?clientid='+customerName;
    return this.http.get<[]>(ledgerurl, requestOptions).pipe(map((res :any) => res));  
  }
    //handle refresh evnet
    callRefreshMethod(params: any = 'refresh') {
      this.invokeRefreshMethod.emit(params);
    }
   getClientcodes() {
    const headerDict = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
    const requestOptions = {
      headers: new HttpHeaders(headerDict),
    };
    let clientcodeurl = this.apiurl + 'clientcodes';
    return this.http.get<[]>(clientcodeurl,requestOptions).pipe(map((res :any) => res));
  }
}
