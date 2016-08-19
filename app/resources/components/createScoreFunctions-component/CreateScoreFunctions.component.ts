import { Component, OnInit }										from '@angular/core';

// Application classes:
import { ScoreFunctionDirective }										from '../../directives/ScoreFunction.directive';
import { ValueChartService }											from '../../services/ValueChart.service';
import { ChartUndoRedoService }											from '../../services/ChartUndoRedo.service';
import { ScoreFunctionViewerService }									from '../../services/ScoreFunctionViewer.service';

// Model Classes
import { ValueChart } 													from '../../model/ValueChart';
import { User }															from '../../model/User';
import { ScoreFunctionMap }												from '../../model/ScoreFunctionMap';
import { Objective }													from '../../model/Objective';      
import { Domain }														from '../../model/Domain';
import { CategoricalDomain }											from '../../model/CategoricalDomain';
import { ContinuousDomain }												from '../../model/ContinuousDomain';
import { IntervalDomain }												from '../../model/IntervalDomain';
import { ScoreFunction }												from '../../model/ScoreFunction';
import { DiscreteScoreFunction }										from '../../model/DiscreteScoreFunction';
import { ContinuousScoreFunction }										from '../../model/ContinuousScoreFunction';

@Component({
  selector: 'CreateScoreFunctions',
  templateUrl: 'app/resources/components/createScoreFunctions-component/CreateScoreFunctions.template.html',
  directives: [ScoreFunctionDirective]
})
export class CreateScoreFunctionsComponent implements OnInit {
    user: User;
    selectedObjective: string;
    private services: any = {};

  constructor(
    private valueChartService: ValueChartService,
    private chartUndoRedoService: ChartUndoRedoService) { }

  ngOnInit() {
    this.services.valueChartService = this.valueChartService;
    this.services.chartUndoRedoService = this.chartUndoRedoService;
    this.services.scoreFunctionViewerService = new ScoreFunctionViewerService(this.valueChartService);

    this.user = this.valueChartService.getCurrentUser();
    if (!this.user.getScoreFunctionMap()) {
      this.user.setScoreFunctionMap(this.getInitialScoreFunctionMap());
    }

    this.selectedObjective = this.valueChartService.getValueChart().getAllPrimitiveObjectives()[0].getName();
  }

  advanceSelectedObjective() {
    let primObjs: string[] = this.valueChartService.getValueChart().getAllPrimitiveObjectivesByName();
    let selectedIndex: number = primObjs.indexOf(this.selectedObjective);
    let nextIndex: number = selectedIndex + 1;
    if (nextIndex >= primObjs.length) {
      nextIndex = 0;
    }
    this.selectedObjective = primObjs[nextIndex];
  }

  getObjective(name: string): Objective {
    for (let obj of this.valueChartService.getValueChart().getAllObjectives()) {
      if (obj.getName() === name) {
        return obj;
      }
    }
    throw "Objective not found";
  }

  // Set up initial ScoreFunctions
  // Scores for categorical variables are evenly space between 0 and 1
  getInitialScoreFunctionMap(): ScoreFunctionMap {
    let scoreFunctionMap: ScoreFunctionMap = new ScoreFunctionMap();
    for (let obj of this.valueChartService.getValueChart().getAllPrimitiveObjectives()) {
      let scoreFunction: ScoreFunction;
      if (obj.getDomainType() === 'categorical' || obj.getDomainType() === 'interval') {
        scoreFunction = new DiscreteScoreFunction();
        let dom = (<CategoricalDomain>obj.getDomain()).getElements();
        let increment = 1.0 / (dom.length - 1);
        let currentScore = 0;
        for (let item of dom) {
          scoreFunction.setElementScore(item, currentScore);
          currentScore += increment;
        }
      }
      else {
        let min: number = (<ContinuousDomain>obj.getDomain()).getMinValue();
        let max: number = (<ContinuousDomain>obj.getDomain()).getMaxValue();
        scoreFunction = new ContinuousScoreFunction(min, max);
        // Add three evenly-space points between min and max
        let increment = (max - min) / 4.0;
        let slope = 1.0 / (max - min);
        scoreFunction.setElementScore(min, 0);
        scoreFunction.setElementScore(min + increment, slope * increment);
        scoreFunction.setElementScore(min + 2 * increment, slope * 2 * increment);
        scoreFunction.setElementScore(min + 3 * increment, slope * 3 * increment);
        scoreFunction.setElementScore(max, 1);
      }
      scoreFunctionMap.setObjectiveScoreFunction(obj.getName(), scoreFunction);
    }
    return scoreFunctionMap;
  }
}