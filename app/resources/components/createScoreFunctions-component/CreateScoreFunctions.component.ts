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
  directives: [ScoreFunctionDirective],
  providers: [ScoreFunctionViewerService]
})
export class CreateScoreFunctionsComponent implements OnInit {
  user: User;
  selectedObjective: string;
  initialBestOutcomes: { [objName: string]: string | number };
  initialWorstOutcomes: { [objName: string]: string | number };
  private services: any = {};

  constructor(
    private valueChartService: ValueChartService,
    private chartUndoRedoService: ChartUndoRedoService,
    private scoreFunctionViewerService: ScoreFunctionViewerService) { }

  ngOnInit() {
    this.services.valueChartService = this.valueChartService;
    this.services.chartUndoRedoService = this.chartUndoRedoService;
    this.services.scoreFunctionViewerService = this.scoreFunctionViewerService;

    this.user = this.valueChartService.getCurrentUser();
    this.initialBestOutcomes = {};
    this.initialWorstOutcomes = {};

    if (!this.user.getScoreFunctionMap()) {
      this.user.setScoreFunctionMap(this.valueChartService.getInitialScoreFunctionMap());
    }
    for (let objName of this.valueChartService.getPrimitiveObjectivesByName()) {
      this.initialBestOutcomes[objName] = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).bestElement;
      this.initialWorstOutcomes[objName] = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).worstElement;
    }
    this.selectedObjective = this.valueChartService.getPrimitiveObjectives()[0].getName();
  }

  ngOnDestroy() {
    // Reset weight map if best or worst outcome has changed
    for (let objName of this.valueChartService.getPrimitiveObjectivesByName()) {
      let newBestOutcome = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).bestElement;
      let newWorstOutcome = this.user.getScoreFunctionMap().getObjectiveScoreFunction(objName).worstElement;
      if (newBestOutcome !== this.initialBestOutcomes[objName] || newWorstOutcome !== this.initialWorstOutcomes[objName]) {
        this.valueChartService.resetWeightMap(this.user, this.valueChartService.getDefaultWeightMap());
      }
    }
  }

  advanceSelectedObjective() {
    let primObjs: string[] = this.valueChartService.getPrimitiveObjectivesByName();
    let selectedIndex: number = primObjs.indexOf(this.selectedObjective);
    let nextIndex: number = selectedIndex + 1;
    if (nextIndex >= primObjs.length) {
      nextIndex = 0;
    }
    this.selectedObjective = primObjs[nextIndex];
  }
}
