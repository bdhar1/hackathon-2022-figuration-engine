import { NgModule,APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import {NgbCollapseModule} from '@ng-bootstrap/ng-bootstrap';
import { BrowserModule } from '@angular/platform-browser';
import { DashboardComponent } from 'src/components/dashboard/dashboard.component';
import { LedgerComponent } from 'src/components/ledger/ledger.component';
import { NavMenuComponent } from 'src/components/nav-menu/nav-menu.component';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DashboardService } from 'src/services/dashboard.service';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LedgerService } from 'src/services/ledger.service';
import { ConfigLoaderService } from 'src/services/config-loader.service';
import { PreloadFactory } from './preload-service.factory';
import { LoadingInterceptor } from 'src/helpers/loading.interceptor';
import { SpinnerComponent } from 'src/components/spinner/spinner.component';

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    AppComponent,
    DashboardComponent,
    LedgerComponent,
    NavMenuComponent,
    SpinnerComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    NgbCollapseModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule ,
    HttpClientModule,
  ],
  providers: [DashboardService,LedgerService,
    {
      provide: HTTP_INTERCEPTORS, useClass: LoadingInterceptor, multi: true
    },
    ConfigLoaderService,
    {
      provide: APP_INITIALIZER,
      deps: [
        ConfigLoaderService
      ],
      multi: true,
      useFactory: PreloadFactory
    }],
  bootstrap: [AppComponent]
})
export class AppModule { }
