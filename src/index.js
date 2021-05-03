import { parse } from "./parser";

export class Calculator {
    constructor() {
        this.parserResult = [];
    }

    async parseFile() {
		const file = document.getElementById("upload").files[0];
		this.parserResult = await parse(file);
        document.getElementById("display").innerHTML = JSON.stringify(this.parserResult, null, '\t');
    }
}

const GpaCalculator = new Calculator();

window.GpaCalculator = GpaCalculator;
