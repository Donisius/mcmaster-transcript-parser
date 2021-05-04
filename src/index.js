import { parse } from "./parser";
import {
    letterToTwelvePoint,
    letterToFourPoint
} from "./grades-map";

export class Controller {
    constructor() {
        this.pageData = {
            semesterData: [],
            numberOfCourses: null,
            calculatedGpa: null,
            scale: 12
        }
    }

    async parseFile() {
		const file = document.getElementById("uploader").files[0];
        this.pageData.semesterData = await parse(file);
        document.getElementById("submit").disabled = !this.pageData.semesterData.length;
    }

    updatePageData(field) {
        switch (field) {
            case "numberOfCourses":
                this.pageData[field] = parseInt(document.getElementById("number-of-courses").value);
            case "scale":
                this.pageData[field] = parseInt(document.getElementById("scale").value)
        }
    }

    calculateGpa() {
        let counter = 0;
        const includedCourses = [];
        // Get last `n` completed courses from parsed transcript.
        for (let i = this.pageData.semesterData.length - 1; i >= 0; i--) {
            for (let j = this.pageData.semesterData[i].length - 1; j >= 0; j--) {
                if (this.pageData.numberOfCourses !== null && counter >= this.pageData.numberOfCourses) {
                    break;
                }
                const course = this.pageData.semesterData[i][j];
                if (course.weightAchieved > 0 && course.weightAchieved === course.weightPossible) {
                    includedCourses.push(course);
                    counter++;
                }
            }
        }

        this.pageData.calculatedGpa  = includedCourses.reduce(
            (totalGpa, course) => {
                let gradeAdgustment;
                switch (this.pageData.scale) {
                    case 4:
                        gradeAdgustment = letterToFourPoint[course.grade];
                        break;
                    case 12:
                    default: gradeAdgustment = letterToTwelvePoint[course.grade];
                }
                console.log(gradeAdgustment)
                return totalGpa += gradeAdgustment * course.weightAchieved
            }
        , 0) / includedCourses.reduce((totalWeight, course) => totalWeight += course.weightPossible, 0);

        document.getElementById("displayed-grade").innerHTML = this.pageData.calculatedGpa;
    }
}

const PageController = new Controller();

window.PageController = PageController;
