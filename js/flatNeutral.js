// Neutral.js
// Does neutral models in javascript to take advantage of the d3.js libary. 

// utility

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

// DISTRIBUTIONS

// Returns 1 with probability p and 0 with probability (1-p). 
function Bernoulli(p) {
    var unif = Math.random();
    if (unif < p) return 1;
    return 0;
}

// Samples from the Discrete distribution described by the 'probs' vector.
// The ith entry indicates the probability of receiving i. 
function Discrete(probs) {
    if (sumVec(probs) != 1) probs = normalize(probs);
    var k = probs.length;
    for (var i = 0; i < k; i++) {
	var newProbs = normalize(probs.slice(i));
	var choice = Bernoulli(newProbs[0]);
	if (choice == 1) return i;
    }
    return k-1;
}

// Neutral Models OOP. 
function Entity(model, genNumber, genIndex) {
    this.neutModel = model;
    this.generation = genNumber;
    this.genIndex = genIndex;
    this.parents = [];
		this.children = [];

    if (this.generation != 0) {
				this.parents = this.neutModel.unifPopSample(nm.parentsPerEntity, this.generation);
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

 function NeutralModel(numGen, perGen, parentsPer, traitsPer, numTraits) {
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

		 this.designateFitSample = function(howMany, lessThan, fitTraitArray, fitBumpFactor) {
				 if (!lessThan) {
						 var lessThan = this.numGens;
				 }
				 var pop = filterGenLessThan(this.population, lessThan);
				 var probs = fillArrayWith(pop.length, 1).map(function(x, i) {
						 var bump = 0;
						 for (var j = 0; j < fitTraitArray.length; j++) {
								 if (hasTrait(x, fitTraitArray[j])) {
										 bump += fitBumpFactor;
								 }
						 }
						 return x*bump;
				 });
				 var disc = new Discrete(probs);
				 // Agh. Need to sample from a discrete distribution without replacement!!
		 }

//		 this.discretePopSample = function(howMany, lessThan, probs) {
//				 if (!lessThan) {
//						 var lessThan = this.numGens;
//				 }
//				 var pop = filterGenLessThan(this.population, lessThan);
//		 }

		 this.unifTraitSample = function(howMany) {
				 return sampleNoReplace(this.traitPool, howMany);
		 }

		 this.newGeneration = function() {
				 this.currentGen ++;
				 var newGen = [];
				 for (var i = 0; i < this.entitiesPerGen; i++) {
						 newGen.push(new Entity(this, this.currentGen, i));
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




