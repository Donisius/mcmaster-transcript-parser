import { parse } from "./parser";
import {
    letterToTwelvePoint,
    letterToFourPoint
} from "./grades-map";
import "@carbon/charts/styles.css";
import { SimpleBarChart, StackedBarChart } from "@carbon/charts";

const options = {
	title: "Averages per semester",
	axes: {
		left: {
			mapsTo: "value"
		},
		bottom: {
			mapsTo: "group",
			scaleType: "labels"
		}
	},
	height: "400px"
};
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

        let gradeMap;
        switch (this.pageData.scale) {
            case 4:
                gradeMap = letterToFourPoint;
                break;
            case 12:
            default: gradeMap = letterToTwelvePoint;
        }

        this.pageData.calculatedGpa  = lastNCourses.reduce(
            (totalGpa, course) => totalGpa += gradeMap[course.grade] * course.weightAchieved
        , 0) / lastNCourses.reduce((totalWeight, course) => totalWeight += course.weightPossible, 0);

        document.getElementById("displayed-grade").innerHTML = "Your total GPA is " + this.pageData.calculatedGpa;
        generateAveragesPerSemesterChart(this.pageData.semesterData, gradeMap);
        generateIndividualCourseGradesChart(lastNCourses, gradeMap);
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

const generateAveragesPerSemesterChart = (semesters, gradeMap) => {
    const chartAnchor = document.getElementById("average-per-semester");
    chartAnchor.innerHTML = null;
    const data = semesters
        .map((semester, index) => {
            semester = semester
                .filter((course) => course.weightAchieved > 0 && course.weightAchieved === course.weightPossible)
            const totalGpa = semester
                .reduce((totalGpa, course) => totalGpa += gradeMap[course.grade] * course.weightAchieved, 0);

            const totalWeight = semester.reduce((totalWeight, course) => totalWeight += course.weightPossible, 0);

            return {
                group: `Semester ${index + 1}`,
                value: totalGpa / totalWeight
            }
        })
        .filter((datapoint) => datapoint.value > 0)

    new SimpleBarChart(chartAnchor, {
        data,
        options
    });
}

const generateIndividualCourseGradesChart = (lastNCourses, gradeMap) => {
    const chartAnchor = document.getElementById("individual-course-grades");
    chartAnchor.innerHTML = null;
    const data = lastNCourses.map(({course, grade, semesterNumber}) => ({
        group: `Semester ${semesterNumber}`,
        key: course,
        value: gradeMap[grade]
    })).reverse();

    new StackedBarChart(chartAnchor, {
        data,
        options: {
            ...options,
            title: "Individual course grades",
            axes: {
                left: {
                    ...options.axes.left,
                    stacked: true
                },
                bottom: {
                    ...options.axes.bottom,
                    mapsTo: "key"
                },
            }
        }
    });
}

const PageController = new Controller();

window.PageController = PageController;
