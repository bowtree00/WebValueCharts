/*
* @Author: aaronpmishkin
* @Date:   2016-07-05 15:45:47
* @Last Modified by:   aaronpmishkin
* @Last Modified time: 2016-07-06 10:34:29
*/

import { Injectable } 												from '@angular/core';



@Injectable()
export class ObjectiveChartDefinitions {

	CHART: string = 'objective-chart';

	ROW_OUTLINES_CONTAINER: string = 'objective-row-outline-container';
	ROW_OUTLINE: string = 'objective-row-outline';

	ROWS_CONTAINER: string = 'objective-rows-container';
	ROW: string = 'objective-row';

	CELL: string = 'objective-cell';

	USER_SCORES_CONTAINER: string = 'objective-scores-container';
	USER_SCORE: string = 'objective-user-score';

	WEIGHT_OUTLINES_CONTAINER: string = 'objective-weight-outlines-container';
	WEIGHT_OUTLINE: string = 'objective-weight-outline';


	ALTERNATIVE_BOXES_CONTAINER: string = 'objective-alternative-boxes-container';
	ALTERNATIVE_BOX: string = 'objective-alternative-box';

	ALTERNATIVE_LABELS_CONTAINER: string = 'objective-alt-labels-container';
	ALTERNATIVE_LABEL: string = 'objective-alternative-label';

	DOMAIN_LABEL: string = 'objective-domain-label';

	CHART_CELL: string = 'cell';
	CHART_ALTERNATIVE: string = 'alternative-box';

	constructor() { }

}
