// Neutral.js
// Does neutral models in javascript to take advantage of the d3.js libary. 

// utilities

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length != b.length) return false;
 
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

// print array of arrays. 
function paoa(matrix) {
		for (var i = 0; i < matrix.length; i++) {
				console.log(matrix[i]);
		}
}

// random integer in range [low, high], inclusive.
function randomInt(low, high) {
    return Math.round(Math.random()*(high - low)) + low;
}

// sample without replacement.
function sampleNoReplace(array, howMany) {
    var a = array.slice(0);
    var out = [];
    var counter = 0;
    while (counter < howMany) {
			var index = randomInt(0,a.length - 1);
				out.push(a[index]);
				a.splice(index, 1);
				counter++;
    }
    return out;
}

// like range in python!
function rangeFunc(upper) {
    var out = [];
    var i = 0;
    while (i < upper) {
				out.push(i);
				i++;
    }
    return out;
}

function sortNumber(a, b) {
		return a - b;
}

// Does the array contain element 'x'? 
function contains(array, x) {
		var i = array.length;
		while (i--) {
				if (array[i] == x) {
						return true;
				}
		}
		return false;
}

function filterGenLessThan(population, genLimit) {
		var filtered = [];
		for (var i = 0; i < population.length; i++) {
				if (population[i].generation < genLimit) {
						filtered.push(population[i]);
				}
		}
		return filtered;
}

function filterGenInRange(population, gEq, lessThan) {
		var filtered = [];
		for (var i = 0; i < population.length; i++) {
				if (population[i].generation >= gEq & population[i].generation < lessThan) {
						filtered.push(population[i]);
				}
		}
		return filtered;
}

function hasTrait(entity, trait) {
		if (contains(entity.traits, trait)) {
				return 1;
		} else {
				return 0;
		}
}

function getIdentifier(entity) {
		return [entity.generation, entity.genIndex];
}

function isParentOf(entity, parent) {
		for (var i = 0; i < entity.parents.length; i++) {
				var ident = getIdentifier(entity.parents[i]);
				if (arraysEqual(ident,getIdentifier(parent))) return 1;
		}
		return 0;
}

function isChildOf(entity, child) {
		for (var i = 0; i < entity.children.length; i++) {
				var ident = getIdentifier(entity.children[i]);
				if (arraysEqual(ident, getIdentifier(child))) return 1;
		}
		return 0;
}

function sumVec(xs) {
    return xs.reduce(function(a, b) {return a+b;});
}

function normalize(vector) {
    var sum = sumVec(vector);
    return vector.map(function(x) {return x/sum;});
}

function scaleBy(vector, scalar) {
		return vector.map(function(x) { return x*scalar;});
}

function fillZeroes(size) {
    var out = [];
    while (size > 0) {
				out.push(0);
				size--;
    }
    return out;
}

function fillArrayWith(size, thing) {
		var out = [];
		while (size > 0) {
				out.push(thing);
				size--;
		}
		return out;
}

// DISTRIBUTIONS. 
var Sampling = SJS = (function(){

		// Utility functions
		function _sum(a, b) {
				return a + b;
				};
		function _fillArrayWithNumber(size, num) {
				// thanks be to stackOverflow... this is a beautiful one-liner
				return Array.apply(null, Array(size)).map(Number.prototype.valueOf, num);
				};
		function _rangeFunc(upper) {
				    var i = 0, out = [];
				    while (i < upper) out.push(i++);
				    return out;
				};
		// Prototype function
		function _samplerFunction(size) {
				if (!this.draw) { 
						throw new Error ("Distribution must specify a draw function.");
						}
				var result = [];
				while (size--) { 
						result.push(this.draw()); 
						}
				return result;
				};
		// Prototype for discrete distributions
		var _samplerPrototype = {
				sample: _samplerFunction
				};

		function Bernoulli(p) {

				var result = Object.create(_samplerPrototype);

				result.draw = function() {
						return (Math.random() < p) ? 1 : 0;
						};

				result.toString = function() {
						return "Bernoulli( " + p + " )";
						};

				return result;
				}

		function Binomial(n, p) {

				var result = Object.create(_samplerPrototype),
				bern = Sampling.Bernoulli(p);

				result.draw = function() {
						return bern.sample(n).reduce(_sum, 0); // less space efficient than adding a bunch of draws, but cleaner :)
						}

				result.toString = function() { 
						return "Binom( " + 
								[n, p].join(", ") + 
								" )"; 
						}

				return result;
				}

		function Discrete(probs) { // probs should be an array of probabilities. (they get normalized automagically) //
				
				var result = Object.create(_samplerPrototype),
				k = probs.length;

				result.draw = function() {
						var i, p;
						for (i = 0; i < k; i++) {
								p = probs[i] / probs.slice(i).reduce(_sum, 0); // this is the (normalized) head of a slice of probs
								if (Bernoulli(p).draw()) return i;             // using the truthiness of a Bernoulli draw
								}
						return k - 1;
						};

				result.sampleNoReplace = function(size) {
						    if (size>probs.length) {
										throw new Error("Sampling without replacement, and the sample size exceeds vector size.")
										    }
						    var disc, index, sum, samp = [];
						    var currentProbs = probs;
						    var live = _rangeFunc(probs.length);
						    while (size--) {
										sum = currentProbs.reduce(_sum, 0);
										currentProbs = currentProbs.map(function(x) {return x/sum; });
										disc = SJS.Discrete(currentProbs);
										index = disc.draw();
										samp.push(live[index]);
										live.splice(index, 1);
										currentProbs.splice(index, 1);
										sum = currentProbs.reduce(_sum, 0);
										currentProbs = currentProbs.map(function(x) {return x/sum; });
										    }
						    currentProbs = probs;
						    live = _rangeFunc(probs.length);
						    return samp;
						}

				result.toString = function() {
						return "Dicrete( [" + 
								probs.join(", ") + 
								"] )";
						};

				return result;
				}

		function Multinomial(n, probs) {

				var result = Object.create(_samplerPrototype),
				k = probs.length,
				disc = Discrete(probs);

				result.draw = function() {
						var draw_result = _fillArrayWithNumber(k, 0),
						i = n;
						while (i--) {
								draw_result[disc.draw()] += 1;
								}
						return draw_result;
						};

				result.toString = function() {
						return "Multinom( " + 
								n + 
								", [" + probs.join(", ") + 
								"] )";
						};

				return result;
				}

		return {
				_fillArrayWithNumber: _fillArrayWithNumber, // REMOVE EVENTUALLY - this is just so the Array.prototype mod can work
				_rangeFunc: _rangeFunc,
				Bernoulli: Bernoulli,
				Binomial: Binomial,
				Discrete: Discrete,
				Multinomial: Multinomial
				};
})();

//*** Sampling from arrays ***//
// Eventually merge into SJS ???
function sample_from_array(array, numSamples, withReplacement) {
		var n = numSamples || 1,
		result = [],
		copy,
		disc,
		index;

		if (!withReplacement && numSamples > array.length) {
				throw new Error("Sampling without replacement, and the sample size exceeds vector size.")
				}

		if (withReplacement) {
				while(numSamples--) {
						disc = SJS.Discrete(SJS._fillArrayWithNumber(array.length, 1));
						result.push(array[disc.draw()]);
						}
				} else {
						// instead of splicing, consider sampling from an array of possible indices? meh?
						copy = array.slice(0);
						while (numSamples--) {
								disc = SJS.Discrete(SJS._fillArrayWithNumber(copy.length, 1));
								index = disc.draw();
								result.push(copy[index]);
								copy.splice(index, 1);
								console.log("array: "+copy);
						}
						}
		return result;
}

// Neutral Models OOP. 
function Entity(model, genNumber, genIndex, pa, paStr, ad, adStr) {
    this.neutModel = model;
    this.generation = genNumber;
    this.genIndex = genIndex;
    this.parents = [];
		this.children = [];

    if (this.generation != 0) {
				this.parents = this.neutModel.nonUnifPopSample(nm.parentsPerEntity, this.generation, pa, paStr, ad, adStr);
				for (var i = 0; i < this.parents.length; i++) {
						this.parents[i].children.push(this);
				}
    }

    this.neutModel.population.push(this);
    this.traits = this.neutModel.unifTraitSample(nm.traitsPerEntity);
		this.sharedTraits = [];

		this.populateSharedTraits = function() {
				for (var i = 0; i < this.parents.length; i++) {
						var parent = this.parents[i];
						for (var j = 0; j < this.parents[i].traits.length; j++) {
								var trait = this.parents[i].traits[j];
								if (contains(this.traits, trait)) {
										this.sharedTraits.push({parent: parent, trait: trait});
										if (!contains(this.neutModel.whichTraitsShared, trait)) {
												this.neutModel.whichTraitsShared.push(trait);
										}
								}
						}
				}
		}
		this.populateSharedTraits();

		this.toString = function() {
				return "<"+genNumber +", "+genIndex+">";
		}
 }

 function NeutralModel(numGen, perGen, parentsPer, traitsPer, numTraits, pa, paStr, ad, adStr) {
		 this.numGens = numGen;
		 this.entitiesPerGen = perGen;
		 this.parentsPerEntity = parentsPer;
		 this.traitsPerEntity = traitsPer;
		 this.traitDictSize = numTraits;

		 this.population = [];
		 this.currentGen = -1;
		 this.traitPool = rangeFunc(numTraits);
		 this.whichTraitsShared = [];

		 // filter population by generation so that we don't sample parents
		 // from the same generation.
		 this.unifPopSample = function(howMany, lessThan) {
				 if (!lessThan) {
						 var lessThan = this.numGens;
				 }
				 var pop = filterGenLessThan(this.population, lessThan);
				 return sampleNoReplace(pop, howMany);
		 }

		 this.prefAttPopSample = function(howMany, lessThan, strength) {
				 if (!strength) {
						 var strength = 1;
				 }
				 if (!lessThan) {
						 var lessThan = this.numGens;
				 }
				 var pop = filterGenLessThan(this.population, lessThan);
				 var probs = pop.map(function(x) {return (1/pop.length) + x.children.length * strength;})
				 var disc = SJS.Discrete(probs);
				 return  disc.sampleNoReplace(howMany).map(function(x) {return pop[x]; });
		 }

		 // pa = 'pref. attach', ad = 'age decay'
		 this.nonUnifPopSample = function(howMany, lessThan, pa, paStr, ad, adStr) {
				 if (!lessThan) {
						 var lessThan = this.numGens;
				 }
				 var pop = filterGenLessThan(this.population, lessThan);
				 var probs = pop.map(function() { return 1/pop.length; })
				 if (pa && ad) {
						 probs = pop.map(function(x) {
								 return (1/pop.length + (filterGenLessThan(x.children, lessThan).length * paStr) - 
												 adStr*((1/this.numGens)*x.generation));
						 });
				 } else if (pa) {
						 probs = pop.map(function(x) {
								 return (1/pop.length) + paStr * (filterGenLessThan(x.children, lessThan).length);
						 });
				 } else if (ad) {
						 probs = pop.map(function(x) {
								 return (1/pop.length - adStr * ((1/this.numGens)*(this.numGens - x.generation)));
						 })
				 }
				 var disc = SJS.Discrete(probs);
				 return  disc.sampleNoReplace(howMany).map(function(x) {return pop[x]; });
		 }

		 this.unifTraitSample = function(howMany) {
				 return sampleNoReplace(this.traitPool, howMany);
		 }

		 this.newGeneration = function() {
				 this.currentGen ++;
				 var newGen = [];
				 for (var i = 0; i < this.entitiesPerGen; i++) {
						 if (prefAttach) {
								 newGen.push(new Entity(this, this.currentGen, i, pa, paStr, ad, adStr));
						 } else {
								 newGen.push(new Entity(this, this.currentGen, i));
						 }
				 }
				 return newGen;
		 }

		 this.createModel = function() {
				 for (var i = 0; i < this.numGens; i++) {
						 this.newGeneration();
				 }
				 this.whichTraitsShared.sort(sortNumber);
		 }

		 this.getId = function(index) {
				 return [this.population[index].generation, this.population[index].genIndex];
		 }

		 this.getIndex = function(gen, genIndex) {
				 return gen * this.entitiesPerGen + genIndex;
		 }

		 this.avgNumTraitShares = function() {
				 var numEntities = this.numGens * this.entitiesPerGen;
				 var total = 0;
				 for (var i = entitiesPerGen; i < numEntities; i++) {
						 total += this.population[i].sharedTraits.length;
				 }
				 return total/numEntities;
		 }

		 this.getShareArray = function() {
				 var out = [];
				 var numEntities = this.numGens * this.entitiesPerGen;
				 for (var i = 0; i < numEntities; i++) {
						 var n = this.population[i].sharedTraits.length;
						 for (var j = 0; j < n; j++) {
								 out.push({share: this.population[i].sharedTraits[j], child: this.population[i]});
						 }
				 }
				 return out;
		 }

		 this.getCiteArray = function() {
				 var out = [];
				 var numEntities = this.numGens * this.entitiesPerGen;
				 for (var i = this.entitiesPerGen; i < numEntities; i++) {
						 for (var j = 0; j < this.parentsPerEntity; j++) {
								 out.push({child: this.population[i], 
									     parent: this.population[i].parents[j]})
						 }
				 }
				 return out;
		 }

		 this.clear = function() {
				 this.population = [];
				 this.currentGen = -1;
				 this.whichTraitsShared = [];
		 }

		 this.getPerGenPEQ = function(trait) {
				 var data = [];
				 for (var i = 0; i < (this.numGens - 1); i++) {
						 var A = filterGenInRange(this.population, 0, i+1);
						 var D = filterGenInRange(this.population, i+1, i+2);
						 var dF = diffFecundity(A, D, trait);
						 var dM = diffMutation(A, D, trait);
						 var dC = diffConvergence(A, D, trait);
						 data.push({"gen": i+1,"dF": dF, "dM": dM, "dC": dC, "tot": dF+dM-dC});
				 }
				 return data;
		 }
}

function filterSharesByTrait(shares, traitIndex) {
		var filtered = [];
		var numShares = shares.length;
		for (var i = 0; i < numShares; i++) {
				if (shares[i].share.trait == traitIndex) {
						filtered.push(shares[i]);
				}
		}
		return filtered;
}

// i/o utilities. 

function getid(entity) {
		var nm = entity.neutModel;
		return entity.generation * nm.entitiesPerGen + entity.genIndex;
}

function getParentageCSV(nm) {
		var numCols = nm.parentsPerEntity;
		var numRows = nm.numGens * nm.entitiesPerGen;
		var data = [];
		for (var i = 0; i < numRows; i++) {
				data.push(nm.population[i].parents.map(getid))
		}
		data.map(function(d) {
				return d.join(",");
		});
		var csvContent = "data:text/csv;charset=utf-8,";
		data.forEach(function(infoArray, index){
				dataString = infoArray.join(",");
				csvContent += dataString +"\n";
		});
		return encodeURI(csvContent);
}

function getTraitCSV(nm) {
    var numCols = nm.traitsPerEntity;
    var numRows = nm.numGens * nm.entitiesPerGen;
    var data = [];
    for (var i = 0; i < numRows; i++) {
	data.push(nm.population[i].traits);
    }
    data.map(function(d) {
	    return d.join(",");
	});
    var csvContent = "data:text/csv;charset=utf-8,";
    data.forEach(function(infoArray, index){
	    dataString = infoArray.join(",");
	    csvContent += dataString +"\n";
	});
    return encodeURI(csvContent);
}

// Price Equation Calculations. 

function avg(X) {
		return sumVec(X)/(X.length);
}

function getColumn(matrix, column) {
		var col = [];
		var numRows = matrix.length;
		for (var i = 0; i < numRows; i++) {
				col.push(matrix[i][column])
		}
		return col;
}

function transpose(matrix) {
		var newMat = [];
		var numRows = matrix.length;
		var numCols = matrix[0].length;
		for (var i = 0; i < numCols; i++) {
				newMat.push(getColumn(matrix, i));
		}
		return newMat;
}


function numChildren(matrix, row) {
		return sumVec(matrix[row]);
}

function numParents(matrix, column) {
		var col = getColumn(matrix, column);
		return sumVec(col);
}

function cov(X, Y) {
		if (X.length != Y.length) throw "Exception: must have same length.";
		var n = X.length;
		var xMean = avg(X);
		var yMean = avg(Y);
		var runTot = 0;
		for (var i = 0; i < n; i++) {
				runTot += (X[i] - xMean)*(Y[i] - yMean);
		}
		return runTot/(n-1);
}

function getC(ancestralPop, descendantPop) {
		var matrix = [];
		for (var i = 0; i < ancestralPop.length; i++) {
				var childArray = fillZeroes(descendantPop.length);
				for (var j = 0; j < descendantPop.length; j++) {
						childArray[j] = isParentOf(descendantPop[j], ancestralPop[i]);
				}
				matrix.push(childArray);
		}
		return matrix;
}

function traitChar(pop, trait) {
		return pop.map(function(x) { return hasTrait(x, trait); });
}

function numChildrenChar(matrix) {
		return matrix.map(function(x) {return sumVec(x);});
}

function numChildrenRelChar(matrix) {
		var avgNumC = avgNumChildren(matrix);
		return scaleBy(numChildrenChar(matrix), 1/avgNumC);
}

function numParentsChar(matrix) {
		var mt = transpose(matrix);
		return mt.map(function(x) { return sumVec(x); })
}

function numParentsRelChar(matrix) {
		var avgNumP = avgNumParents(matrix);
		return scaleBy(numParentsChar(matrix), 1/avgNumP);
}

function avgNumChildren(matrix) {
		return avg(numChildrenChar(matrix));
}

function avgNumParents(matrix) {
		return avg(numParentsChar(matrix));
}

function traitDiff(parent, child, trait) {
		return hasTrait(child, trait) - hasTrait(parent, trait);
}

function numTotalCites(matrix) {
		return sumVec(numChildrenChar(matrix));
}

function mutation(parent, child, trait) {
		if (isChildOf(parent, child) == 1) {
				return traitDiff(parent, child, trait);
		} 
		return 0;
}

function diffFecundity(aPop, dPop, trait) {
		var c = getC(aPop, dPop);
		var aTraitChar = traitChar(aPop, trait);
		var aChildrenChar = numChildrenRelChar(c);
		return cov(aTraitChar, aChildrenChar);
}

function diffMutation(aPop, dPop, trait) {
		var c = getC(aPop, dPop);
		var mutTot = 0;
		for (var i = 0; i < aPop.length; i++) {
				for (var j = 0; j < dPop.length; j++) {
						mutTot += mutation(aPop[i], dPop[j], trait);
				}
		}
		return mutTot / numTotalCites(c);
}

function diffConvergence(aPop, dPop, trait) {
		var c = getC(aPop, dPop);
		var dTraitChar = traitChar(dPop, trait);
		var dParentsChar = numParentsRelChar(c);
		return cov(dTraitChar, dParentsChar);
}

function getPriceEQs(population, startGen, endGen, trait) {

		var A = filterGenInRange(population, 0, startGen);
		console.log("Ancestral Population: gens 0 through " + (startGen - 1) + ". (" +A.length + " entities)" );
		var D = filterGenInRange(population, startGen, endGen);
		console.log("Descendant Population: gens " + (startGen - 1) + " to " + (endGen - 1) + ".(" + D.length + "entities)");
		console.log("Differential Fecundity for trait 1: " + diffFecundity(A, D, 1) + ".");
		console.log("Differential Mutation for trait 1: " + diffMutation(A, D, 1) + ".");
		console.log("Differential Convergence for trait 1: " + diffConvergence(A, D, 1) + ".");
}




