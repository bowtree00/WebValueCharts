/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-03 14:29:04
*/

import { Component } 										from '@angular/core';
import { OnInit } 											from '@angular/core';
import { Routes, Router, ROUTER_DIRECTIVES }				from '@angular/router';
import { TemplateRef, ViewContainerRef, ElementRef }		from '@angular/core';

// Application classes
import { RegisterComponent }								from '../register-component/Register.component';
import { CreateComponent }									from '../create-component/Create.component';
import { ValueChartViewerComponent }						from '../valueChartViewer-component/ValueChartViewer.component';
import { XMLValueChartParser } 								from '../../services/XMLValueChartParser.service';
import { ChartDataService }									from '../../services/ChartData.service';

@Component({
	selector: 'root',
	templateUrl: 'app/resources/components/root-component/Root.template.html',
	directives: [ROUTER_DIRECTIVES],
	providers: [XMLValueChartParser, TemplateRef, ViewContainerRef, ChartDataService]
})
@Routes([
  {path: '/register', component: RegisterComponent}, // useAsDefault: true - coming soon...
  {path: '/create', component: CreateComponent},
  {path: '/view/ValueChart', component: ValueChartViewerComponent}
])
export class RootComponent implements OnInit {

	constructor(private router: Router) {}
	
	ngOnInit() {
  	}

}