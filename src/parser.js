import * as pdfjs from "pdfjs-dist";
// To avoid error: `Setting up fake worker failed: "Cannot read property 'WorkerMessageHandler' of undefined"`.
pdfjs.GlobalWorkerOptions.workerSrc = require("pdfjs-dist/build/pdf.worker.entry.js");
// ----------------------------------- REGEX -----------------------------------
const gradesRegex = /[0-9]+.[0-9]+.\/[0-9]+.[0-9]+(?:Grade|,|\s*)?(COM|[A-Z][+-]?)/g;
// Follow the instructions in `getCoursePrefixes.js` is this needs to be updated/replaced.
const courseNameRegex = /(ANTHROP|ARABIC|ART|ARTHIST|ARTSSCI|ASTRON|AUTOTECH|BIOCHEM|BIOLOGY|BIOMEDDC|BIOPHYS|BIOSAFE|BIOTECH|CAYUGA|CHEM|CHEMBIO|CHEMENG|CHINESE|CIVENG|CIVTECH|CLASSICS|CMST|CMTYENGA|COLLAB|COMMERCE|COMPENG|COMPSCI|EARTHSC|ECON|ELECENG|ENGINEER|ENGLISH|ENGNMGT|ENGPHYS|ENGSOCTY|ENGTECH|ENRTECH|ENVIRSC|ENVSOCTY|EXPLORE|FARSI|FRENCH|GENTECH|GEOG|GERMAN|GLOBALZN|GREEK|HEBREW|HISTORY|HLTHAGE|HTHSCI|HUMAN|HUMBEHV|IBEHS|IBH|INDIGST|INNOVATE|INSPIRE|INTENG|INUKTUT|ISCI|ITALIAN|JAPANESE|KINESIOL|KOREAN|LABRST|LATIN|LIFESCI|LINGUIST|MANTECH|MATH|MATLS|MECHENG|MECHTRON|MEDPHYS|MEDRADSC|MELD|MIDWIF|MMEDIA|MOHAWK|MOLBIOL|MUSIC|MUSICCOG|NEUROSCI|NURSING|OJIBWE|PEACEST|PHARMAC|PHILOS|PHYSICS|PNB|POLISH|POLSCI|PROCTECH|PSYCH|RELIGST|RUSSIAN|SANSKRIT|SCAR|SCICOMM|SCIENCE|SEP|SFWRENG|SFWRTECH|SMRTTECH|SOCIOL|SOCPSY|SOCSCI|SOCWORK|SPANISH|STATS|SUSTAIN|THTRFLM|WHMIS|WOMENST)\s?[A-Z0-9]{4}/g;
// The best delimiter I found goes by the pattern ``--- ${yearNumber} ${season} ---`.
// I know it's hacky I'm open to better options.
const semesterDelimiterRegex = /---\s?[0-9]{4}\s?(Spring\/Summer|Fall|Winter)\s?---/g;
const weightAchievedRegex = /(?<=\/)[0-9]+.[0-9]+/; // NOTE: Positive lookbehind may not be supported in all browsers!
const weightPossibleRegex = /[0-9]+.[0-9]+(?=\/)/; // NOTE: Positive lookahead may not be supported in all browsers!
const letterGradeRegex = /COM|[A-F][+-]?/;
// -----------------------------------------------------------------------------
/**
 * Parses McMaster pdf transcript for course information for each semester.
 * Returns a Promise that resolves to an array of ojects representing each semester.
 * Each semester object contains the `coursesWithGrades` key which contains an array
 * of ojects representing information about all the courses taken in that semester.
 * 
 * For example, a possible output can be:
 * 
 * [
 * 		{
 * 			coursesWithGrades: [
 * 				{
 * 					course: "SFWRENG 3A04",
 * 					grade: 12,
 * 					weightAchived: 4,
 * 					weightPossible: 4
 * 				},
 *  			{
 * 					course: "SFWRENG 2DM3",
 * 					grade: 2,
 * 					weightAchived: 3,
 * 					weightPossible: 3
 * 				},
 * 				etc...
 * 			]	
 * 		},
 *  	{
 * 			coursesWithGrades: [
 * 				{
 * 					course: "MATLS 1M03",
 * 					grade: 1,
 * 					weightAchived: 3,
 * 					weightPossible: 3
 * 				},
 *  			{
 * 					course: "SFWRENG 3DX4",
 * 					grade: 12,
 * 					weightAchived: 4,
 * 					weightPossible: 4
 * 				},
 * 				etc...
 * 			]	
 * 		},
 * 		etc...
 * ]
 * 
 * @param file File object from file input.
 */
export const parse = (file) => (
	new Promise((resolve, reject) => {
		const fileReader = new FileReader();
		fileReader.onload = async (event) => {
			try {
				const typeDArray = new Uint8Array(event.target.result);
				const pdf = await pdfjs.getDocument(typeDArray).promise;
				const maxPages = pdf._pdfInfo.numPages;
				const pagePromises = [];
				for (let i = 1; i <= maxPages; i++) { // Pages start at 1.
					const page = await pdf.getPage(i);
					pagePromises.push((async () => {
						const textContent = await page.getTextContent();
						return textContent.items.map((s) => s.str).join("");
					})());
				};
				const text = await Promise.all(pagePromises);
				// Split into separate semesters.
				const semestersTexts = text
					.join()
					.split(semesterDelimiterRegex)
					.filter((section) => section !== "Spring\/Summer" && section !== "Fall" && section !== "Winter");
				// The first value from splitting is not a semester.
				semestersTexts.shift();
				// This section extracts information for each semester.
				const semesters = [];
				semestersTexts.forEach((semester) => {
					const gradesInfos = [];
					const courseNames = [];
			
					let execResult = [];
					while ((execResult = gradesRegex.exec(semester)) !== null) {
						gradesInfos.push(execResult[0]);
					}
					while ((execResult = courseNameRegex.exec(semester)) !== null) {
						courseNames.push(execResult[0]);
					}
					semesters.push(courseNames.map((courseName, index) => {
						const gradeInfo = gradesInfos[index];
						return {
							course: courseName,
							grade: gradeInfo && weightAchievedRegex.exec(gradeInfo)[0] === weightPossibleRegex.exec(gradeInfo)[0]
								? letterGradeRegex.exec(gradeInfo)[0]
								: null,
							weightAchieved: gradeInfo ? parseInt(weightAchievedRegex.exec(gradeInfo)[0]) : 0,
							weightPossible: gradeInfo ? parseInt(weightPossibleRegex.exec(gradeInfo)[0]) : 0
						}
					}));
				});
				resolve(semesters);
			} catch(error) {
				reject(error);
			}
		};
	
		fileReader.readAsArrayBuffer(file);
	})
)
