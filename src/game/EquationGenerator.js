/**
 * Dynamic Math Equation Generator for Equation Bubbles
 */
export class EquationGenerator {
  /**
   * Generates a game wave with guaranteed 2 matching equations
   * and distractors.
   */
  static generateWave(level = 1, bubbleCount = 6) {
    const rules = this.getLevelRules(level);
    const target = this.pickTarget(rules);

    const correctEquations = [];
    const wrongEquations = [];

    // Always generate 2 guaranteed correct equations
    for (let i = 0; i < 2; i++) {
      const eq = this.createEquationForTarget(target, rules);
      correctEquations.push({
        text: eq.text,
        value: target,
        isCorrect: true
      });
    }

    // Generate distractor equations (values != target)
    const numWrong = bubbleCount - correctEquations.length;
    const usedDistractors = new Set([target]);

    let safety = 0;
    while (wrongEquations.length < numWrong && safety < 100) {
      safety++;
      const distractorVal = this.pickDistractorValue(target, rules);
      if (usedDistractors.has(distractorVal)) continue;
      usedDistractors.add(distractorVal);

      const eq = this.createEquationForTarget(distractorVal, rules);
      wrongEquations.push({
        text: eq.text,
        value: distractorVal,
        isCorrect: false
      });
    }

    // Fallback if needed
    while (wrongEquations.length < numWrong) {
      const val = target + (wrongEquations.length + 1);
      wrongEquations.push({
        text: `${val - 1} + 1`,
        value: val,
        isCorrect: false
      });
    }

    // Guarantee that at least one correct equation is near the front of the wave
    const all = [correctEquations[0], ...wrongEquations, correctEquations[1]];

    return {
      target,
      equations: all
    };
  }

  /**
   * Generates a single guaranteed correct equation for the specified target.
   */
  static createCorrectEquation(target, level = 1) {
    const rules = this.getLevelRules(level);
    const eq = this.createEquationForTarget(target, rules);
    return {
      text: eq.text,
      value: target,
      isCorrect: true
    };
  }

  /**
   * Generates a single distractor equation different from the target.
   */
  static createDistractorEquation(target, level = 1) {
    const rules = this.getLevelRules(level);
    const distractorVal = this.pickDistractorValue(target, rules);
    const eq = this.createEquationForTarget(distractorVal, rules);
    return {
      text: eq.text,
      value: distractorVal,
      isCorrect: false
    };
  }

  static getLevelRules(level) {
    const world = Math.min(10, Math.max(1, Math.ceil(level / 10)));
    const step = ((level - 1) % 10) + 1; // 1 to 10 within world

    switch (world) {
      case 1: // World 1: Starter Meadow (Sums to 10)
        return {
          world,
          step,
          ops: ['+'],
          minTarget: 2 + Math.floor(step * 0.4),
          maxTarget: 4 + step,
          maxOperand: 10
        };

      case 2: // World 2: Addition Ascent (Sums to 25)
        return {
          world,
          step,
          ops: ['+'],
          minTarget: 8 + Math.floor(step * 0.6),
          maxTarget: 14 + step,
          maxOperand: 20
        };

      case 3: // World 3: Subtraction Shore (Minus to 10)
        return {
          world,
          step,
          ops: ['-'],
          minTarget: 1 + Math.floor(step * 0.3),
          maxTarget: 3 + Math.floor(step * 0.7),
          maxOperand: 12
        };

      case 4: // World 4: Subtraction Summit (Minus to 25)
        return {
          world,
          step,
          ops: ['-'],
          minTarget: 4 + Math.floor(step * 0.6),
          maxTarget: 10 + Math.floor(step * 1.5),
          maxOperand: 25
        };

      case 5: // World 5: Harmony Hills (Mixed + and - to 30)
        return {
          world,
          step,
          ops: ['+', '-'],
          minTarget: 5 + Math.floor(step * 0.7),
          maxTarget: 12 + Math.floor(step * 1.6),
          maxOperand: 30
        };

      case 6: // World 6: Multiplication Grove (2s, 5s, 10s)
        return {
          world,
          step,
          ops: ['x'],
          allowedMultipliers: [2, 5, 10],
          minTarget: 4,
          maxTarget: 50
        };

      case 7: // World 7: Times Table Peak (3s, 4s, 6s, 7s, 8s, 9s)
        return {
          world,
          step,
          ops: ['x'],
          allowedMultipliers: [3, 4, 6, 7, 8, 9],
          minTarget: 9,
          maxTarget: 72
        };

      case 8: // World 8: Division Lagoon (÷ 2, 3, 5, 10)
        return {
          world,
          step,
          ops: ['÷'],
          allowedDivisors: [2, 3, 5, 10],
          minTarget: 2,
          maxTarget: 10 + Math.floor(step * 0.5)
        };

      case 9: // World 9: Operation Oasis (All 4 Ops)
        return {
          world,
          step,
          ops: ['+', '-', 'x', '÷'],
          minTarget: 4 + Math.floor(step * 0.5),
          maxTarget: 20 + step,
          allowedDivisors: [2, 3, 4, 5],
          allowedMultipliers: [2, 3, 4, 5]
        };

      case 10: // World 10: Grandmaster Galaxy (Master Mix to 50)
      default:
        return {
          world: 10,
          step,
          ops: ['+', '-', 'x', '÷'],
          minTarget: 6 + step,
          maxTarget: 30 + step * 2,
          allowedDivisors: [2, 3, 4, 5, 6, 8],
          allowedMultipliers: [2, 3, 4, 5, 6, 7, 8, 9]
        };
    }
  }

  static pickTarget(rules) {
    if (rules.ops.length === 1 && rules.ops[0] === 'x') {
      const mults = rules.allowedMultipliers || [2, 3, 4, 5, 6, 7, 8, 9];
      const a = mults[Math.floor(Math.random() * mults.length)];
      const b = 2 + Math.floor(Math.random() * 8); // 2..9
      return a * b;
    }
    const range = Math.max(1, rules.maxTarget - rules.minTarget + 1);
    return rules.minTarget + Math.floor(Math.random() * range);
  }

  static pickDistractorValue(target, rules) {
    const delta = (Math.random() < 0.5 ? -1 : 1) * (1 + Math.floor(Math.random() * 4));
    let val = target + delta;
    if (val <= 1) val = target + 2;
    return val;
  }

  static createEquationForTarget(target, rules) {
    const op = rules.ops[Math.floor(Math.random() * rules.ops.length)];

    if (op === '+') {
      const minA = 1;
      const maxA = Math.max(1, target - 1);
      const a = minA + Math.floor(Math.random() * maxA);
      const b = Math.max(0, target - a);
      return { text: `${a} + ${b}`, value: target };
    } else if (op === '-') {
      const b = 1 + Math.floor(Math.random() * 8);
      const a = target + b;
      return { text: `${a} - ${b}`, value: target };
    } else if (op === 'x') {
      if (rules.allowedMultipliers) {
        const mults = rules.allowedMultipliers.filter(m => target % m === 0);
        if (mults.length > 0) {
          const m = mults[Math.floor(Math.random() * mults.length)];
          return { text: `${m} × ${target / m}`, value: target };
        }
      }
      // Find factors of target between 2 and 10
      const factors = [];
      for (let i = 2; i <= 10; i++) {
        if (target % i === 0 && (target / i) <= 12) {
          factors.push(i);
        }
      }
      if (factors.length > 0) {
        const f = factors[Math.floor(Math.random() * factors.length)];
        return { text: `${f} × ${target / f}`, value: target };
      } else {
        // Fallback to addition if not cleanly factorable
        const a = Math.floor(target / 2);
        return { text: `${a} + ${target - a}`, value: target };
      }
    } else if (op === '÷') {
      const divisors = rules.allowedDivisors || [2, 3, 4, 5, 6, 8, 10];
      const d = divisors[Math.floor(Math.random() * divisors.length)];
      const dividend = target * d;
      return { text: `${dividend} ÷ ${d}`, value: target };
    }

    return { text: `${target} + 0`, value: target };
  }

  static shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
}
