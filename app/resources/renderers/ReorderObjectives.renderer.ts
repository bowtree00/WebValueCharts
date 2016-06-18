/*
* @Author: aaronpmishkin
* @Date:   2016-06-17 09:05:15
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-06-17 21:16:11
*/

import { Injectable } 												from '@angular/core';
import { NgZone }													from '@angular/core';

// d3
import * as d3 														from 'd3';

// Application Classes
import { ChartDataService, VCCellData, VCRowData, VCLabelData }		from '../services/ChartData.service';
import { RenderConfigService } 										from '../services/RenderConfig.service';
import { LabelRenderer }											from '../renderers/Label.renderer';



// Model Classes
import { Objective }												from '../model/Objective';
import { PrimitiveObjective }										from '../model/PrimitiveObjective';
import { AbstractObjective }										from '../model/AbstractObjective';


// This class contains all the logic for dragging objective labels change the order of objectives in the objective and summary charts.
// Any objective label can be dragged within the confines of its parent label's Dimension Two so that it may be reordered with respect 
// to its siblings (ie. the other children of the parent). The rows of the objective and summary charts are reordered to reflect the change
// in the label ordering when a label is released.

@Injectable()
export class ReorderObejctivesRenderer {
	private ignoreReorder: boolean;

	private primitiveObjectives: PrimitiveObjective[]

	private reorderObjectiveMouseOffset: number;
	private totalCoordTwoChange: number = 0;

	private containerToReorder: d3.Selection<any>;
	private parentObjectiveName: string;
	private parentContainer: d3.Selection<any>;
	private siblingContainers: d3.Selection<any>;

	private objectiveDimensionTwo: number;
	private objectiveCoordTwoOffset: number;
	private maxCoordinateTwo: number;

	private currentObjectiveIndex: number;
	private newObjectiveIndex: number;
	private jumpPoints: number[];

	constructor(
		private renderConfigService: RenderConfigService,
		private chartDataService: ChartDataService,
		private labelRenderer: LabelRenderer) { }

	// This function is called when a user first beings to drag a label to rearrange the ordering of objectives. It contains all the logic required to initialize the drag,
	// including determining the bounds that the label can be dragged in, the points where the label is considered to have switched positions, etc.
	startReorderObjectives = (d: VCLabelData, i: number) => {
		// Reset variables.
		this.ignoreReorder = false;							// Whether the drag events should be ignored. If true, all further dragging of the current label will be ignored.
		this.reorderObjectiveMouseOffset = undefined;		// Offset of the mouse from the Coordinate Two position of the label that is to be dragged. 
		this.totalCoordTwoChange = 0;						// The Coordinate Two distance that the label has been moved so far.

		this.containerToReorder = d3.select('#label-' + d.objective.getName() + '-container');			// The container that holds the label we are reordering.
		this.parentObjectiveName = (<Element>this.containerToReorder.node()).getAttribute('parent');	// The name of the parent objective for the label we are reordering.

		// If the selected label is the root label, then it is not possible to reorder, and all further drag events for this selection should be ignored.
		if (this.parentObjectiveName === 'rootcontainer') {
			this.ignoreReorder = true;
			return;
		}

		this.parentContainer = d3.select('#label-' + this.parentObjectiveName + '-container');						// The container that holds the container for the label we are reordering.
		this.siblingContainers = this.parentContainer.selectAll('g[parent=' + this.parentObjectiveName + ']');		// The selection of label containers s.t. every label container is at the same level as containerToReorder, with the same parent.
																													// Note: siblingsConatiners includes containerToReorder.
		// Set all the siblings that are NOT being moved to be partially transparent.
		this.siblingContainers.style('opacity', 0.5);
		this.containerToReorder.style('opacity', 1);

		// Just until the location of score functions is fixed.
		this.labelRenderer.scoreFunctionContainer.selectAll('.label-scorefunction').style('opacity', 0.5);

		var parentOutline: d3.Selection<any> = this.parentContainer.select('rect'); 		// Select the rect that outlines the parent label of the label we are reordering.
		var currentOutline: d3.Selection<any> = this.containerToReorder.select('rect');		// Select the rect that outlines the label we are reordering.

		this.objectiveDimensionTwo = +currentOutline.attr(this.renderConfigService.dimensionTwo);							// Determine the Dimension Two (height if vertical, width of horizontal) of the label we are moving.
		this.maxCoordinateTwo = +parentOutline.attr(this.renderConfigService.dimensionTwo) - this.objectiveDimensionTwo;	// Determine the maximum Coordinate Two of the label we are reordering.
		this.objectiveCoordTwoOffset = +currentOutline.attr(this.renderConfigService.coordinateTwo);						// Determine the initial Coordinate Two position (y if vertical, x if horizontal) of the label we are reordering.
		
		this.currentObjectiveIndex = this.siblingContainers[0].indexOf(this.containerToReorder.node());						// Determine the position of the label we are reordering in the list of siblings.
		this.newObjectiveIndex = this.currentObjectiveIndex;
		this.jumpPoints = [0];																								// Initialize the list of points which define what position the label we are reordering has been moved to.

		this.siblingContainers.select('rect')[0].forEach((el: Element) => {
			if (el !== undefined) {
				// For each of the labels that the label we are reordering can be switched with, determine its Coordinate Two midpoint. This is used to determine what position the label we are reordering has been moved to.
				let selection: d3.Selection<any> = d3.select(el);
				let jumpPoint: number = (+selection.attr(this.renderConfigService.dimensionTwo) / 2) + +selection.attr(this.renderConfigService.coordinateTwo);
				this.jumpPoints.push(jumpPoint);
			}
		});

		this.jumpPoints.push(this.renderConfigService.dimensionTwoSize);
	}

	// This function is called whenever a label that is being reordered is dragged by the user. It contains the logic which updates the
	// position of the label so the user knows where they have dragged it to as well as the code that determines what position the label will be in when dragging ends.
	reorderObjectives = (d: VCLabelData, i: number) => {
		// Do nothing if we are ignoring the current dragging of the label.
		if (this.ignoreReorder) {
			return;
		}
		// Get the change in Coordinate Two from the d3 event.
		var deltaCoordinateTwo: number = (<any>d3.event)[this.renderConfigService.coordinateTwo];

		// If we have not yet determined the mouse offset, then this is the first drag event that has been fired, and the mouse offset from 0 should the current mouse position.
		if (this.reorderObjectiveMouseOffset === undefined) {
			this.reorderObjectiveMouseOffset = deltaCoordinateTwo;
		}

		deltaCoordinateTwo = deltaCoordinateTwo - this.reorderObjectiveMouseOffset; // Subtract the mouse offset to get the change in Coordinate Two from the 0 point.

		// Calculate the current Coordinate Two position of the label that is being reordered. 
		// This is the recent change (deltaCoordinateTwo) + the totalChange so far (this.totalCoordTwoChange) + the offset of the label before dragging began (this.objectiveCoordTwoOffset)
		var currentCoordTwoPosition: number = deltaCoordinateTwo + this.totalCoordTwoChange + this.objectiveCoordTwoOffset; 
		
		// Make sure that the label does not exit the bounds of the label area.
		if (currentCoordTwoPosition < 0) {
			deltaCoordinateTwo = 0 - this.totalCoordTwoChange - this.objectiveCoordTwoOffset;
		} else if (currentCoordTwoPosition > this.maxCoordinateTwo) {
			deltaCoordinateTwo = this.maxCoordinateTwo - this.totalCoordTwoChange - this.objectiveCoordTwoOffset;
		}

		// Add the most recent change in Coordinate Two to the total change so far.
		this.totalCoordTwoChange += deltaCoordinateTwo;

		// If we are dragging the label up, then we want to check the current position of the label from its top.
		// If we are dragging the label down, then we want to check the current position of the label form its bottom.
		var labelDimensionTwoOffset: number = (this.totalCoordTwoChange > 0) ? this.objectiveDimensionTwo : 0;
		// Determine which of the two jump points the label is current between, and assigned its new position accordingly.
		for (var i = 0; i < this.jumpPoints.length; i++) {
			if (this.totalCoordTwoChange + deltaCoordinateTwo + labelDimensionTwoOffset > (this.jumpPoints[i] - this.objectiveCoordTwoOffset)
				&& this.totalCoordTwoChange + deltaCoordinateTwo + labelDimensionTwoOffset < (this.jumpPoints[i + 1] - this.objectiveCoordTwoOffset)) {
				this.newObjectiveIndex = i;
				break;
			}
		}
		// If we were dragging down, then the index is one off and must be decremented.
		if (this.totalCoordTwoChange > 0)
			this.newObjectiveIndex--;

		// Retrieved the previous transform of the label we are dragging so that it can be incremented properly.
		var currentTransform: string = this.containerToReorder.attr('transform');
		var commaIndex: number = currentTransform.indexOf(',');
		// Pull the current transform coordinates form the string. + is a quick operation that converts them into numbers.
		var xTransform: number = +currentTransform.substring(currentTransform.indexOf('(') + 1, commaIndex);
		var yTransform: number = +currentTransform.substring(commaIndex + 1, currentTransform.indexOf(')'));

		// Generate the new transform.
		var labelTransform: string = this.generateNewLabelTransform(xTransform, yTransform, deltaCoordinateTwo);

		// Apply the new transformation to the label.
		this.containerToReorder.attr('transform', labelTransform);
		// Apply a similar translation to the affect score function plots.
		this.adjustScoreFunctionPosition(this.labelRenderer.scoreFunctionContainer, deltaCoordinateTwo, d.objective);

	}

	// This function is called when the label that is being reordered is released by the user, and dragging ends. It contains the logic for re-rendering the ValueChart according 
	// to the labels new position.
	endReorderObjectives = (d: VCLabelData, i: number) => {
		// Do nothing if we are ignoring the current dragging of the label.
		if (this.ignoreReorder) {
			return;
		}
		// Get the label data for the siblings of the label we arranged. Note that this contains the label data for the label we rearranged.
		var parentData: VCLabelData = this.parentContainer.datum();

		// Move the label data for the label we rearranged to its new position in the array of labels.
		if (this.newObjectiveIndex !== this.currentObjectiveIndex) {
			let temp: VCLabelData = parentData.subLabelData[this.currentObjectiveIndex];
			parentData.subLabelData.splice(this.currentObjectiveIndex, 1);
			parentData.subLabelData.splice(this.newObjectiveIndex, 0, temp);
		}

		// Select all the label data, not just the siblings of the label we moved.
		var labelData: VCLabelData[] = d3.select('g[parent=rootcontainer]').data();


		// Retrieve the objective ordering from the ordering of the label data.
		var primitiveObjectives: PrimitiveObjective[] = this.getOrderedObjectives(labelData);

		// Delete the previous label area.
		(<Element>d3.select('.label-root-container').node()).remove();
		// Rebuild and re-render the label area.
		this.labelRenderer.createLabelSpace(d3.select('.ValueChart'), labelData, primitiveObjectives);
		this.labelRenderer.renderLabelSpace(labelData, this.renderConfigService.viewOrientation, primitiveObjectives);
		// Re-arrange the rows of the objective and summary charts according to the new objective ordering. Note this triggers change detection in ValueChartDirective that 
		// updates the object and summary charts. This is to avoid making the labelRenderer dependent on the other renderers.
		this.chartDataService.reorderRows(primitiveObjectives);
		// Turn on objective sorting again. This was turned off because the label area was reconstructed.
		this.labelRenderer.toggleObjectiveSorting(true);
	}

	generateNewLabelTransform(previousXTransform: number, previousYTransform: number, deltaCoordinateTwo: number): string {
		if (this.renderConfigService.viewOrientation === 'vertical') {
			return 'translate(' + previousXTransform + ',' + (previousYTransform + deltaCoordinateTwo) + ')';
		} else {
			return 'translate(' + (previousXTransform + deltaCoordinateTwo) + ',' + previousYTransform + ')';
		}
	}

	// This function extracts the ordering of objectives from the ordering of labels.
	getOrderedObjectives(labelData: VCLabelData[]): PrimitiveObjective[] {
		var primitiveObjectives: PrimitiveObjective[] = [];
		labelData.forEach((labelDatum: VCLabelData) => {
			if (labelDatum.depthOfChildren === 0) {
				primitiveObjectives.push(<PrimitiveObjective>labelDatum.objective);
			} else {
				primitiveObjectives = primitiveObjectives.concat(this.getOrderedObjectives(labelDatum.subLabelData));
			}
		});
		return primitiveObjectives;

	}

	// This function moves the score functions to maintain the position within the label that is being dragged.
	adjustScoreFunctionPosition(container: d3.Selection<any>, deltaCoordinateTwo: number, objective: Objective): void {
		if (objective.objectiveType === 'abstract') {
			(<AbstractObjective>objective).getAllSubObjectives().forEach((subObjective: Objective) => {
				this.adjustScoreFunctionPosition(container, deltaCoordinateTwo, subObjective);
			});
		} else {
			var scoreFunction: d3.Selection<any> = this.labelRenderer.rootContainer.select('#label-' + objective.getName() + '-scorefunction');
			let currentTransform: string = scoreFunction.attr('transform');
			let commaIndex: number = currentTransform.indexOf(',');
			let xTransform: number = +currentTransform.substring(currentTransform.indexOf('(') + 1, commaIndex);
			let yTransform: number = +currentTransform.substring(commaIndex + 1, currentTransform.indexOf(')'));
			let scoreFunctionTransform: string = this.generateNewLabelTransform(xTransform, yTransform, deltaCoordinateTwo);
			scoreFunction.attr('transform', scoreFunctionTransform);
		}
	}

}