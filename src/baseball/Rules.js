
export class BaseballRules {
  static createCount() {
    return {
      balls: 0,
      strikes: 0,
      outs: 0,
      inning: 1,
      half: "top",
      homeScore: 0,
      awayScore: 0,
      bases: [false, false, false],
      finished: false
    };
  }

  static advanceInning(state) {
    state.balls = 0;
    state.strikes = 0;
    state.outs = 0;
    state.bases = [false, false, false];

    if (state.half === "top") {
      state.half = "bottom";
    } else {
      state.half = "top";
      state.inning++;
    }

    if (state.inning > 9) {
      state.finished = true;
    }
  }

  static ball(state) {
    state.balls++;

    if (state.balls >= 4) {
      state.balls = 0;
      state.strikes = 0;
      this.advanceRunner(state);
      return "포볼! 타자가 1루로 출루한다.";
    }

    return "볼!";
  }

  static strike(state) {
    state.strikes++;

    if (state.strikes >= 3) {
      state.outs++;
      state.strikes = 0;
      state.balls = 0;
      return "삼진 아웃!";
    }

    return "스트라이크!";
  }

  static foul(state) {
    if (state.strikes < 2) state.strikes++;
    return "파울!";
  }

  static out(state) {
    state.outs++;
    state.balls = 0;
    state.strikes = 0;

    if (state.outs >= 3) {
      this.advanceInning(state);
      return "아웃! 공수가 교대된다.";
    }

    return "아웃!";
  }

  static advanceRunner(state) {
    if (state.bases[2]) {
      if (state.half === "top") state.awayScore++;
      else state.homeScore++;
    }

    state.bases[2] = state.bases[1];
    state.bases[1] = state.bases[0];
    state.bases[0] = true;
  }

  static hit(state, bases) {
    let runs = 0;

    for (let i = 2; i >= 0; i--) {
      if (!state.bases[i]) continue;

      const destination = i + bases;

      if (destination >= 3) {
        runs++;
      } else {
        state.bases[destination] = true;
      }

      state.bases[i] = false;
    }

    if (bases >= 4) {
      runs += 1;
      state.bases = [false, false, false];
    } else {
      state.bases[0] = true;
    }

    if (state.half === "top") state.awayScore += runs;
    else state.homeScore += runs;

    state.balls = 0;
    state.strikes = 0;

    return {
      runs,
      label: bases >= 4 ? "홈런!" :
        bases === 3 ? "3루타!" :
        bases === 2 ? "2루타!" : "안타!"
    };
  }
}
