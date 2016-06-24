/*
* @Author: aaronpmishkin
* @Date:   2016-05-25 14:41:41
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-24 13:55:28
*/


import { Directive, Input } 													from '@angular/core';
import { OnInit, DoCheck, SimpleChange }										from '@angular/core';
import { TemplateRef, ViewContainerRef, ElementRef }							from '@angular/core';
import { KeyValueDiffers, IterableDiffers, KeyValueDiffer, IterableDiffer }		from '@angular/core';

// d3
import * as d3 																	from 'd3';

// Application classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }					from '../services/ChartData.service';
import { RenderConfigService }													from '../services/RenderConfig.service';
import { ChartUndoRedoService }													from '../services/ChartUndoRedo.service';

import { ObjectiveChartRenderer }												from '../renderers/ObjectiveChart.renderer';
import { SummaryChartRenderer }													from '../renderers/SummaryChart.renderer';
import { LabelRenderer }														from '../renderers/Label.renderer';

import { ReorderObjectivesInteraction }											from '../interactions/ReorderObjectives.interaction';
import { ResizeWeightsInteraction }												from '../interactions/ResizeWeights.interaction';
import { SortAlternativesInteraction }											from '../interactions/SortAlternatives.interaction';

// Model Classes
import { ValueChart } 															from '../model/ValueChart';
import { GroupValueChart } 														from '../model/GroupValueChart';
import { IndividualValueChart } 												from '../model/IndividualValueChart';
import { PrimitiveObjective }													from '../model/PrimitiveObjective';
import { WeightMap }															from '../model/WeightMap';
import { User }																	from '../model/User';
import { ScoreFunction }														from '../model/ScoreFunction';

@Directive({
	selector: 'ValueChart',
	inputs: ['data', 'orientation']
})
export class ValueChartDirective implements OnInit, DoCheck {

	private isInitialized: boolean;
	// Inputs to the directive.
	private valueChart: ValueChart;		// A ValueChart. Can be an IndividualValueChart or a GroupValueChart

	private previousOrientation: string;
	private viewOrientation: string;	// View orientation. Either 'horizontal' or 'vertical'

	// Height and width of the viewport for use with viewBox attribute of the root SVG element

	private viewportWidth: number;
	private viewportHeight: number;

	// ValueChart data that has been organized to work with d3.
	private dataRows: VCRowData[];	// ValueCharts row (or column if in vertical orientation) data. Each array element is the data for one objective.
	private labelData: VCLabelData[];
	private primitiveObjectives: PrimitiveObjective[];

	private valueChartDiffer: KeyValueDiffer;
	private userDiffer: KeyValueDiffer;
	private weightMapDiffer: KeyValueDiffer;
	private scoreFunctionMapDiffer: KeyValueDiffer;
	private scoreFunctionDiffer: KeyValueDiffer;
	private scoreFunctionDiffers: KeyValueDiffer[];
	private rowsDiffer: IterableDiffer;
	private cellsDiffer: IterableDiffer;

	// Interaction Toggles
	private interactions: any = {};
	private previousInteractions: any = {};

	// Fields for d3 collections that should be saved for later manipulation
	private el: d3.Selection<any>; // The SVG base element for the ValueChart rendering.

	constructor(
		// Angular Resources:
		private template: TemplateRef<any>,
		private viewContainer: ViewContainerRef,
		private elementRef: ElementRef,
		private differs: KeyValueDiffers,
		private arrayDiffers: IterableDiffers,
		// Services:
		private chartDataService: ChartDataService,
		private renderConfigService: RenderConfigService,
		// Renderers:
		private objectiveChartRenderer: ObjectiveChartRenderer,
		private summaryChartRenderer: SummaryChartRenderer,
		private labelRenderer: LabelRenderer,
		// Interactions:
		private reorderObjectivesInteraction: ReorderObjectivesInteraction,
		private resizeWeightsInteraction: ResizeWeightsInteraction,
		private sortAlternativesInteraction: SortAlternativesInteraction) { 
	}


	// Variable binding functions. These functions are called when the directive is initialized.


	// Binds to the directive attribute 'data', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives data attribute.
	@Input() set data(value: any) {
		this.valueChart = <ValueChart> value;
	}

	// View Configuration

	// Binds to the directive attribute 'orientation', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives orientation attribute.
	@Input() set orientation(value: any) {
		this.viewOrientation = <string> value;
	}

	// Binds to the directive attribute 'displayScoreFunctions', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives displayScoreFunctions attribute.
	@Input() set displayScoreFunctions(value: any) {
		this.renderConfigService.viewConfiguration.displayScoreFunctions = <boolean> value;
	}

	// Binds to the directive attribute 'displayDomainValues', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives displayDomainValues attribute.
	@Input() set displayDomainValues(value: any) {
	this.renderConfigService.viewConfiguration.displayDomainValues = <boolean>value;
	}

	// Binds to the directive attribute 'displayScales', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives displayScales attribute.
	@Input() set displayScales(value: any) {
	this.renderConfigService.viewConfiguration.displayScales = <boolean>value;
	}

	// Binds to the directive attribute 'displayTotalScores', and is automatically called upon before ngOnInit. 
	// The variable 'value' is whatever was input to the directives displayTotalScores attribute.
	@Input() set displayTotalScores(value: any) {
		this.renderConfigService.viewConfiguration.displayTotalScores = <boolean>value;
	}

	@Input() set displayScoreFunctionValueLabels(value: any) {
		this.renderConfigService.viewConfiguration.displayScoreFunctionValueLabels = <boolean>value;
	}

	// Interactions:

	@Input() set reorderObjectives(value: any) {
		this.interactions.reorderObjectives = <boolean> value;
	}

	@Input() set sortAlternatives(value: any) {	
		this.interactions.sortAlternatives = <string> value;
	}

	@Input() set pumpWeights(value: any) {
		this.interactions.pumpWeights = <string> value;
	}

	@Input() set setObjectiveColors(value: any) {
		this.interactions.setObjectiveColors = <string>value;
	}


	// Initialization code for the ValueChart goes in this function. ngOnInit is called by Angular AFTER the first ngDoCheck()
	// and after the input variables are initialized. This means that this.valueChart and this.viewOrientation are defined.
	// ngOnInit is only called ONCE. This function should thus be used for one-time initialized only.
	ngOnInit() {
		// Configure the size of the user viewport. This will be scaled to fit the browser window
		this.viewportWidth = 1700;
		this.viewportHeight = 850;

		// Configure the Chart Data Service: 
		this.chartDataService.setValueChart(this.valueChart);

		this.dataRows = this.chartDataService.getRowData(this.valueChart);
		this.dataRows = this.chartDataService.calculateWeightOffsets(this.dataRows);
		this.dataRows = this.chartDataService.calculateStackedBarOffsets(this.dataRows, this.viewOrientation);
		this.chartDataService.rows = this.dataRows;

		this.labelData = this.chartDataService.getLabelData(this.valueChart);
		this.chartDataService.labelData = this.labelData;

		this.primitiveObjectives = this.valueChart.getAllPrimitiveObjectives();


		// Configure the Render Service:
		this.renderConfigService.recalculateDimensionTwoScale(this.viewOrientation);
		this.renderConfigService.configureViewOrientation(this.viewOrientation);


		// Create the SVG base element, and set it to dynamically fit to the viewport:
		this.el = d3.select(this.elementRef.nativeElement).append('svg')
			.classed({ 'ValueChart': true, 'svg-content-responsive': true })
			.attr('viewBox', '0 -10' + ' ' + this.viewportWidth + ' ' + this.viewportHeight)
			.attr('preserveAspectRatio', 'xMinYMin meet');


		// Render the ValueChart:
		this.labelRenderer.createLabelSpace(this.el, this.labelData, this.primitiveObjectives);
		this.labelRenderer.renderLabelSpace(this.labelData, this.viewOrientation, this.primitiveObjectives);

		this.objectiveChartRenderer.createObjectiveChart(this.el, this.dataRows);
		this.objectiveChartRenderer.renderObjectiveChart(this.viewOrientation);

		this.summaryChartRenderer.createSummaryChart(this.el, this.dataRows);
		this.summaryChartRenderer.renderSummaryChart(this.dataRows, this.viewOrientation);

		// Initialize Change Detection:
		this.initChangeDetection();

		// ValueChart Setup is complete:
		this.isInitialized = true;	
	}

	initChangeDetection(): void {
		// Create Differs for the pieces of the ValueChart:
		this.valueChartDiffer = this.differs.find({}).create(null);
		this.userDiffer = this.differs.find({}).create(null);
		this.weightMapDiffer = this.differs.find({}).create(null);
		this.scoreFunctionMapDiffer = this.differs.find({}).create(null);
		this.rowsDiffer = this.arrayDiffers.find([]).create(null);
		this.cellsDiffer = this.arrayDiffers.find([]).create(null);

		var user = (<IndividualValueChart>this.valueChart).getUser();
		var scoreFunctionMap = user.getScoreFunctionMap();

		var scoreFunctions: ScoreFunction[] = scoreFunctionMap.getAllScoreFunctions();

		this.scoreFunctionDiffers = [];

		scoreFunctions.forEach((scoreFunction: ScoreFunction) => {
			let scoreFunctionDiffer = this.differs.find({}).create(null);
			this.scoreFunctionDiffers.push(scoreFunctionDiffer);
		});

		// View Configuration

		this.previousOrientation = this.viewOrientation;

		this.renderConfigService.previousViewConfiguration.displayScoreFunctions			= this.renderConfigService.viewConfiguration.displayScoreFunctions;
		this.renderConfigService.previousViewConfiguration.displayDomainValues 				= this.renderConfigService.viewConfiguration.displayDomainValues;
		this.renderConfigService.previousViewConfiguration.displayScales 					= this.renderConfigService.viewConfiguration.displayScales;
		this.renderConfigService.previousViewConfiguration.displayTotalScores 				= this.renderConfigService.viewConfiguration.displayTotalScores;
		this.renderConfigService.previousViewConfiguration.displayScoreFunctionValueLabels 	= this.renderConfigService.viewConfiguration.displayScoreFunctionValueLabels


		// Interactions:

		this.previousInteractions.reorderObjectives = this.interactions.reorderObjectives;
		this.previousInteractions.sortAlternatives = this.interactions.sortAlternatives;
		this.previousInteractions.pumpWeights = this.interactions.pumpWeights; 
		this.previousInteractions.setObjectiveColors = this.interactions.setObjectiveColors;
	}


	// This function is called by Angular whenever it detects that a change to this directive's inputs MAY have occurred. The method body is our implementation of change
	// detection. We are implementing our own change detection Since Angular's change detection (ngOnChanges) is by reference. Note that when a a class implements 
	// DoCheck, ngOnChanges is never called, even if the class also implements OnChanges. This means that changes must both be detected, and handled in ngDoCheck.
	ngDoCheck() {
		// DO NOT proceed with change detection if the directive has not yet been initialized.
		if (this.isInitialized === undefined)
			return;

		// Check the data for changes:

		this.chartDataService.setValueChart(this.valueChart);
		var valueChartChanges = this.valueChartDiffer.diff(this.valueChart);

		if (valueChartChanges) {
			this.onValueChartChange();
		}

		var user = (<IndividualValueChart>this.valueChart).getUser();
		var userChanges = this.userDiffer.diff(user);

		var internalWeightMap = user.getWeightMap().getInternalWeightMap();

		var weightMapChanges = this.weightMapDiffer.diff(internalWeightMap);

		if (weightMapChanges) {
			this.onValueChartChange();
		}

		var scoreFunctionMap = user.getScoreFunctionMap();
		var scoreFunctionMapChanges = this.scoreFunctionMapDiffer.diff(scoreFunctionMap);

		var scoreFunctions: ScoreFunction[] = scoreFunctionMap.getAllScoreFunctions();

		scoreFunctions.forEach((scoreFunction: ScoreFunction, index: number) => {
			var scoreFunctionChanges = this.scoreFunctionDiffers[index].diff(scoreFunction.getElementScoreMap());
			
			if (scoreFunctionChanges) {
				this.onValueChartChange();
			}
	
		});

		var rowsChanges = this.rowsDiffer.diff(this.dataRows);
		if (rowsChanges) {
			this.onRowChange();
		}
		// Check to see if the order of the cells has changed.
		var cellsChanges = this.cellsDiffer.diff(this.dataRows[0].cells);
		if (cellsChanges) {
			this.onRowChange();
		}
		// Check View Configuration options:

		if (this.previousOrientation !== this.viewOrientation) {
			this.previousOrientation = this.viewOrientation;
			this.onOrientationChange();
		}

		if (this.renderConfigService.viewConfiguration.displayScoreFunctions !== this.renderConfigService.previousViewConfiguration.displayScoreFunctions) {
			this.renderConfigService.previousViewConfiguration.displayScoreFunctions = this.renderConfigService.viewConfiguration.displayScoreFunctions;
			// Toggle Score Functions.
			this.onDisplayScoreFunctionsChange();
		}

		if (this.renderConfigService.viewConfiguration.displayDomainValues !== this.renderConfigService.previousViewConfiguration.displayDomainValues) {
			this.renderConfigService.previousViewConfiguration.displayDomainValues = this.renderConfigService.viewConfiguration.displayDomainValues;
			// Toggle Domain Labels.
			this.objectiveChartRenderer.toggleDomainLabels();
		}

		if (this.renderConfigService.viewConfiguration.displayScales !== this.renderConfigService.previousViewConfiguration.displayScales) {
			this.renderConfigService.previousViewConfiguration.displayScales = this.renderConfigService.viewConfiguration.displayScales;
			// Toggle Utility Scale
			this.summaryChartRenderer.toggleUtilityAxis();
		}

		if (this.renderConfigService.viewConfiguration.displayTotalScores !== this.renderConfigService.previousViewConfiguration.displayTotalScores) {
			this.renderConfigService.previousViewConfiguration.displayTotalScores = this.renderConfigService.viewConfiguration.displayTotalScores;
			// Toggle Total Scores
			this.summaryChartRenderer.toggleScoreTotals();
		}

		if (this.renderConfigService.viewConfiguration.displayScoreFunctionValueLabels !== this.renderConfigService.previousViewConfiguration.displayScoreFunctionValueLabels) {
			this.renderConfigService.previousViewConfiguration.displayScoreFunctionValueLabels = this.renderConfigService.viewConfiguration.displayScoreFunctionValueLabels;
			// Toggle Score Function Value Labels.
			this.labelRenderer.toggleScoreFunctionValueLabels();
		}

		// Check the Interactions options:

		if (this.interactions.reorderObjectives !== this.previousInteractions.reorderObjectives) {
			this.previousInteractions.reorderObjectives = this.interactions.reorderObjectives;
			// Toggle Dragging to sort objectives:
			this.reorderObjectivesInteraction.toggleObjectiveReordering(this.interactions.reorderObjectives);
		}

		if (this.interactions.sortAlternatives !== this.previousInteractions.sortAlternatives) {
			this.previousInteractions.sortAlternatives = this.interactions.sortAlternatives;
			this.sortAlternativesInteraction.toggleAlternativeSorting(this.previousInteractions.sortAlternatives);
		}

		if (this.interactions.pumpWeights !== this.previousInteractions.pumpWeights) {
			this.previousInteractions.pumpWeights = this.interactions.pumpWeights;
			// Toggle the pump interaction:
			this.resizeWeightsInteraction.togglePump(this.interactions.pumpWeights);
		}

		if (this.interactions.setObjectiveColors !== this.previousInteractions.setObjectiveColors) {
			this.previousInteractions.setObjectiveColors = this.interactions.setObjectiveColors;
			// Toggle setting objective colors:
			this.labelRenderer.toggleSettingObjectiveColors(this.interactions.setObjectiveColors);
		}

		if (this.chartDataService.colorsHaveChanged) {
			// Objective colors have been changed
			this.chartDataService.colorsHaveChanged = false;
			this.onValueChartChange();
		}
	}

	onValueChartChange(): void {
		this.renderConfigService.recalculateDimensionTwoScale(this.viewOrientation);

		this.dataRows = this.chartDataService.calculateWeightOffsets(this.dataRows);
		this.dataRows = this.chartDataService.calculateStackedBarOffsets(this.dataRows, this.viewOrientation);
		
		this.labelData.forEach((labelDatum: VCLabelData) => {
			this.chartDataService.updateLabelData(labelDatum);
		});

		this.labelRenderer.updateLabelSpace(this.labelData, 'rootcontainer', this.viewOrientation, this.primitiveObjectives);
		this.objectiveChartRenderer.updateObjectiveChart(this.dataRows, this.viewOrientation);
		this.summaryChartRenderer.updateSummaryChart(this.dataRows, this.viewOrientation);
	}

	onRowChange(): void {
		this.renderConfigService.recalculateDimensionTwoScale(this.viewOrientation);

		this.dataRows = this.chartDataService.calculateWeightOffsets(this.dataRows);
		this.dataRows = this.chartDataService.calculateStackedBarOffsets(this.dataRows, this.viewOrientation);
		
		this.objectiveChartRenderer.updateObjectiveChart(this.dataRows, this.viewOrientation);
		this.summaryChartRenderer.updateSummaryChart(this.dataRows, this.viewOrientation);

	}

	onOrientationChange(): void {
		this.renderConfigService.configureViewOrientation(this.viewOrientation);
		this.renderConfigService.recalculateDimensionTwoScale(this.viewOrientation);

		this.dataRows = this.chartDataService.calculateStackedBarOffsets(this.dataRows, this.viewOrientation);

		this.labelRenderer.renderLabelSpace(this.labelData, this.viewOrientation, this.primitiveObjectives);
		this.objectiveChartRenderer.renderObjectiveChart(this.viewOrientation);
		this.summaryChartRenderer.renderSummaryChart(this.dataRows, this.viewOrientation);
	}

	onDisplayScoreFunctionsChange(): void {
		this.labelRenderer.renderLabelSpace(this.labelData, this.viewOrientation, this.primitiveObjectives);
	}

}