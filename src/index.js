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
                break;
            case "scale":
                this.pageData[field] = parseInt(document.getElementById("scale").value)
                break;
        }
    }

    calculateGpa() {
        const lastNCourses = getLastNCourses(this.pageData.numberOfCourses, this.pageData.semesterData);

        this.pageData.calculatedGpa  = lastNCourses.reduce(
            (totalGpa, course) => {
                let gradeAdgustment;
                switch (this.pageData.scale) {
                    case 4:
                        gradeAdgustment = letterToFourPoint[course.grade];
                        break;
                    case 12:
                    default: gradeAdgustment = letterToTwelvePoint[course.grade];
                }
                return totalGpa += gradeAdgustment * course.weightAchieved
            }
        , 0) / lastNCourses.reduce((totalWeight, course) => totalWeight += course.weightPossible, 0);

        document.getElementById("displayed-grade").innerHTML = "Your total GPA is " + this.pageData.calculatedGpa;
    }
}

const getLastNCourses = (n, semesters) => {
    let counter = 0;
    const lastNCourses = [];
    // Get last `n` completed courses from parsed transcript.
    for (let i = semesters.length - 1; i >= 0; i--) {
        for (let j = semesters[i].length - 1; j >= 0; j--) {
            if (n !== null && counter >= n) {
                break;
            }
            const course = semesters[i][j];
            if (course.weightAchieved > 0 && course.weightAchieved === course.weightPossible) {
                lastNCourses.push(course);
                counter++;
            }
        }
    }
    return lastNCourses;
}

const PageController = new Controller();

window.PageController = PageController;
