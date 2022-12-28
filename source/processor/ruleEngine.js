import { Engine, Rule } from 'json-rules-engine';

export async function Evaluate(prevTranAmount, tranAmount) {

  let engine = new Engine(defineRules());

  let brok1 = 0;
  let brok2 = 0;
    
  engine.addFact('tran-amount', prevTranAmount);
  await engine.run().then(({ events }) => {
    brok1 = events[0].params.fixedValue + ((prevTranAmount - events[0].params.subtractAmount) * events[0].params.percentValue * 0.01);

    //console.log(brok1);
  })
  
  engine.removeFact('tran-amount');
  engine.addFact('tran-amount', (prevTranAmount + tranAmount));
  await engine.run().then(({ events }) => {
    brok2 = events[0].params.fixedValue + ((prevTranAmount + tranAmount - events[0].params.subtractAmount) * events[0].params.percentValue * 0.01);
    //console.log(brok2);
  })

  return (brok2 - brok1);
}

function defineRules() {
  const rules = [];

  let rule = new Rule({
    conditions: {
      all: [
        {
          fact: 'tran-amount',
          operator: 'lessThanInclusive',
          value: 50000
        }
      ]
    },
    event: {
      type: "LessThan50K",
      params: {
        fixedValue: 0,
        percentValue: 4,
        subtractAmount: 0
      }
    }
  });

  rules.push(rule);

  rule = new Rule({
    conditions: {
      all: [
        {
          fact: 'tran-amount',
          operator: 'greaterThan',
          value: 50000
        },
        {
          fact: 'tran-amount',
          operator: 'lessThanInclusive',
          value: 80000
        }
      ]
    },
    event: {
      type: '50Kto80K',
      params: {
        fixedValue: 2000,
        percentValue: 3,
        subtractAmount: 50000
      }
    }
  });

  rules.push(rule);

  rule = new Rule({
    conditions: {
      all: [
        {
          fact: 'tran-amount',
          operator: 'greaterThan',
          value: 80000
        },
        {
          fact: 'tran-amount',
          operator: 'lessThanInclusive',
          value: 150000
        }
      ]
    },
    event: {
      type: '80Kto150K',
      params: {
        fixedValue: 2900,
        percentValue: 2,
        subtractAmount: 80000
      }
    }
  });

  rules.push(rule);

  rule = new Rule({
    conditions: {
      all: [
        {
          fact: 'tran-amount',
          operator: 'greaterThan',
          value: 150000
        }
      ]
    },
    event: {
      type: 'GreaterThan150K',
      params: {
        fixedValue: 4300,
        percentValue: 1,
        subtractAmount: 150000
      }
    }
  });

  rules.push(rule);

  return(rules);

}