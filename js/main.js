var CONFIG = {
	shifts: [],
	employees: [],
};
var daterange;
var employeeReports;
const settingsWidth = 700;

function importLogs() {
	var period = Utils.getPeriodDates();					
	var logfile = document.getElementById("logfile");
	var fromdatestr = period.from; 
	var todatestr = period.to; 		
	var todateplusonestr = moment(todatestr, 'YYYY/MM/DD').add(1, 'days').format('YYYY/MM/DD');
	var fromdate = (fromdatestr)? new Date(fromdatestr + " 00:00:00") : null; 
	var todate = (todatestr)? new Date(todatestr + " 23:59:59") : null;
	var todateplusone =  (todateplusonestr)? new Date(todateplusonestr + " 23:59:59") : null;
	if (fromdate && todate) {
		Utils.loadDateRange(fromdate, todate);
	}
	var files = logfile.files;
	var file = files[0];			
	Utils.readFile(file, (result)=> {
		var biologs = Utils.generateBiologs(result, fromdate, todateplusone);	
		Utils.load(biologs, period);
	});
}

/* Set the width of the sidebar to 250px and the left margin of the page content to 250px */
function openSettings() { 
	var settings = document.getElementById("settings");
	settings.style.width = settingsWidth+"px";
	settings.style.right = "0px";
	settings.childNodes.forEach((node)=> {
		if (node && node.style)
			node.style.opacity = 1;
	});
}

/* Set the width of the sidebar to 0 and the left margin of the page content to 0 */
function closeSettings() {
	var settings = document.getElementById("settings");
	settings.style.width = "0";
	settings.style.right = "-40px";
	settings.childNodes.forEach((node)=> { 
		if (node && node.style)
			node.style.opacity = 0;
	});
}

class Utils {

	static round(number) {
		return Math.round((number) * 100) / 100;
	}

	static readFile(file, callback) {
		if (file) {
			var fr = new FileReader();
			fr.readAsText(file)
			fr.onload = (e)=> {
				var result = fr.result;
				callback(result);
			};
		}
	}

	static load(rawlogs, period) {  
		/*var sorted = Object.keys(rawlogs).sort()
				.reduce((acc, key) => ({
				...acc, [key]: rawlogs[key]
			}), {});*/
		var temp = Object.keys(rawlogs).map( key => {
			return [key, rawlogs[key]];
		});
		var sorted = temp.sort((a, b)=> {
			var employee1 = CONFIG.employees.find(employee => employee.username == a[0]);
			var employee2 = CONFIG.employees.find(employee => employee.username == b[0]);
			if (employee1 && employee2) {
				return Employee.compare(employee1, employee2);
			} else {
				return -1;
			}
		});
			
		var contentHtml = document.getElementById("content");
		contentHtml.innerHTML = "";
		employeeReports = []; 			
		
		sorted.forEach( record => { 
			var name = record[0];
			var value = record[1];
			var ooologs = (value.ooologs)? value.ooologs.join().replace(/,/g,"\n") : null; 
			var biologs = value.biologs.join().replace(/,/g,"\n"); 
			var employeeReport = new EmployeeAttendanceReport(name, biologs, ooologs, period);
			contentHtml.appendChild(employeeReport.html);
			employeeReports.push(employeeReport);
		});
	}

	static loadDateRange(fromdate, todate) {
		var mfromdate = moment(fromdate);
		var mtodate = moment(todate);
		document.getElementById("weeklabel").value = (mfromdate.format('MMM DD') + 
			" - " + moment(todate).format('MMM DD, YYYY')).toUpperCase();
		daterange = [];
		var diffdate = mtodate.diff(mfromdate, 'days'); 
		var starting = moment(fromdate);
		daterange.push(starting.format('YYYY/MM/DD')); 
		for (var i=0; i< diffdate; i++) {
			starting.add(1, 'days');
			daterange.push(starting.format('YYYY/MM/DD')); 
		} 
		document.title = "BJLPP Employee Daily Time Report-"+mfromdate.format('YYYYMMDD') + "_" + mtodate.format('YYYYMMDD');
	}

	static getWeekDates() {
		var weeknum = document.getElementById("weeknum").value;	
		if (weeknum) {
			var weeknumArr = weeknum.split("-");
			var year = weeknumArr[0];						
			var weekNumber = parseInt(weeknumArr[1].substring(1)); 				
			var start = moment([year, 5, 30]).isoWeek(weekNumber).startOf('isoWeek'); //.add(1, 'days');
			var end = moment(start).endOf('isoWeek'); //.add(6, 'days');
			return {from: start.format('yyyy/MM/DD'), to: end.format('yyyy/MM/DD')};
		}
		return {from: null, to: null};
	}
	
	static getPeriodDates() {
		var selected = Utils.getSelected();
		if (selected == "selectWeek") {
			return Utils.getWeekDates();
		} else {
			var _from = document.getElementById('fromdate').value;
			var _to = document.getElementById('todate').value;
			var from = moment(_from).format('yyyy/MM/DD');
			var to = moment(_to).format('yyyy/MM/DD');
			return {from, to}
		}
	}

	static generateBiologs(file, fromdate, todate) {
		var biologs = [];
		var filtered = [];
		var logs = file.split("\n");
		var map = mapping.bio1;
		if (logs[0].trim().split("\t").length >= 9)
			map = mapping.bio2;

		logs.shift(); //remove the headers
		logs.forEach((log, index)=> {	//extract values
			if (log) {
				var cols = log.split("\t");
				var name = cols[map.name];
				if (name.trim().length > 0) {
					var datetimestr = cols[map.datetime];
					var datetime = new Date(datetimestr); 
					if (fromdate && todate && 
							fromdate <= datetime && todate >= datetime){
						filtered.push(name + "\t" + datetimestr);
					} else if (fromdate == null || todate == null) {
						filtered.push(name + "\t" + datetimestr);
					}
				}
			}
		});
		filtered = Array.from(new Set(filtered)); //remove duplicates
		filtered.forEach((log)=> {
			var split = log.split("\t");
			var name = split[0];
			var datetime = split[1];
			var existing = biologs[name.trim()]; 
			var rec = datetime;
			if (existing) {
				existing.biologs.push(rec);
			} else {
				biologs[name.trim()] = {biologs: [rec]};
			} 
		});
		return biologs;
	}

	static downloadDtr() {
		if (employeeReports && employeeReports.length > 0) {
			var filename = "bjlpp-attendance";
			var start = daterange[0];
			var end = daterange[daterange.length-1];
			filename += "_"+start+"-"+end
			var jsonObjs = employeeReports.map((form)=> {return form.getJsonObj();});
			var saveFileContent = {
				startdate: start,
				enddate: end,
				records: jsonObjs 
			};
			var csv = JSON.stringify(saveFileContent);
			var hiddenElement = document.createElement('a');
			hiddenElement.href = 'data:text/json;charset=utf-8,' + encodeURI(csv);
			hiddenElement.target = '_blank';
			hiddenElement.download = filename + '.dtr';
			hiddenElement.click();
		} else {
			alert('There is nothing to save. Please import the logs or open a .dtr file.');
		}
	}
	
	static uploadDtr() {
		var dtrfile = document.getElementById("dtrfile");
		var file = dtrfile.files[0];
		Utils.readFile(file, (result)=> { 
			if (result) {
				var jsonObj = JSON.parse(result);
				var logArr = [];
				var fromdate = new Date(jsonObj.startdate);
				var todate = new Date(jsonObj.enddate);
				jsonObj.records.forEach((record)=> {
					if (record) {
						var name = record.name;
						var biologs = record.rawdata.biologs.split("\n"); 
						var ooologs = record.rawdata.ooologs.split("\n");
						logArr[name] = {
							biologs: biologs,
							ooologs: ooologs
						};
					}
				}); 
				Utils.loadDateRange(fromdate, todate); 
				var period = Utils.getPeriodDates();
				Utils.load(logArr, period);
			}
		});
	}
	
	static getSelected() {
		var radioNodes = document.getElementsByName('dateSelect');
		var selector = Array.from(radioNodes).filter(el => el.checked)[0];
		return selector.value;
	}
	
	static loadInputDates() {
		var selected = Utils.getSelected();
		var dateSelector = document.getElementById('dateSelector');
		var weekSelector = document.getElementById('weekSelector');
	
		dateSelector.style.display = (selected == "selectWeek")? "none" : "block";
		weekSelector.style.display = (selected == "selectWeek")? "block" : "none";
	}
}

class EmployeeAttendanceReport {
	constructor(name, biologsstring, ooologsstring, period) {
		this._period = period;
		this._name = name;
		this._shiftsdata;
		this._dayrecords = [];
		this._ooorecords;
		this._ooologs = ooologsstring;
		this._biologs = biologsstring;
		this._employee = CONFIG.employees.find(employee => employee.username == this._name);
		
		//Attendance properties
		this._totalworkhours = 0;
		this._totallates = 0;
		this._totalleaves = 0;
		this._totalmissinglogpenalty = 0;
		this._totalpaidbreaks = 0;
		this._totalunpaidbreaks = 0;
		this._totalrestdayworkhours = 0;
		//Out of office properties
		this._totalnoworkrest = 0;
		this._totalholiday = 0;
		this._totalleaves = 0;
		this._totalsuspension = 0;
		this._totalserviceleaves = 0;
	
		this.initializeConfig(name);
		
		if (this._shiftsdata) {
			this.initializeAttendance(biologsstring);
			if (this._ooologs == null) {
				this._ooologs = this.generateOooString();
			} else this.initializeOutOfOffice(ooologsstring);
			this.render();
		} else {
			var wrapper = document.createElement("DIV");
			var title = document.createElement("H2");
			var message = document.createElement("P");
			title.textContent=this._name;
			message.textContent="Contact jan.lajara@bjlprintingpress.com to configure this user into the application. ";
			wrapper.className="no-print";
			wrapper.appendChild(title);
			wrapper.appendChild(message);
			this._html = wrapper;
		}
	}

	get id() {return this._name.trim() + "-form";}
	get name() {return this._name;}
	get employee() {return this._employee;}
	get biologs() {
		var hasNightShift = this._shiftsdata.filter(shift => 
			shift.schedule.filter(sched => 
				sched.isNightShift).length > 0)
			.length > 0; 
		var bl = this._biologs;
		if (!hasNightShift) {
			bl = this._biologs.split("\n").filter(log => {
				if (!log) return false;
				log = log.replace(/\s+/g, " ");
				var split = log.split(" ");
				var date = split[0];
				return !moment(date).isAfter(moment(this._period.to));
			}).join("\n");
		}
		
		return bl;
	}
	get ooologs() {return this._ooologs;}
	get totalworkhours() {return Math.round(this._totalworkhours * 100)/100;}
	get html() {return this._html;}
	
	get biologsformatted() {
		var biologsArr = this.biologs.split("\n");
		var biologsGrouped = [];
		biologsArr.forEach( log => {
			if (log) {
				var logParts = log.split(" ");
				var datestr = logParts.shift();
				var timelog = logParts.join(" ");
				
				var biologGroup = biologsGrouped[datestr];
				if (biologGroup) {
					biologGroup.push(timelog);
				} else {
					var temp = [];
					temp.push(timelog);
					biologsGrouped[datestr] = temp;
				}
			}
		});	
		return biologsGrouped;
	}
	
	initializeConfig(name) { 
		var dataArr = shiftsdata.filter((data) => {
			return data.users.includes(this._name); 
		}); 
		if (dataArr && dataArr[0]) {
			this._shiftsdata = dataArr; 	
		}
	}
	
	initializeAttendance(biologsstr){
		var biologReader = new BiometricLogsReader(biologsstr);
		biologReader.parse(this._shiftsdata, this._employee.shift, this._period);		
		
		this._biologs = biologsstr;
		this._dayrecords = biologReader.attendancedayrecords;			
		this._totalpaidbreaks = 0;
		this._totalunpaidbreaks = 0;
		this._totalworkhours = 0;
		this._totallates = 0;
		this._totalmissinglogpenalty = 0;
		this._totalrestdayworkhours = 0;
		Object.entries(this._dayrecords).forEach(([key, dayrecord])=> { 
			dayrecord.applyCustomRules();
			this._totalpaidbreaks += dayrecord.paidbreaks;
			this._totalunpaidbreaks += dayrecord.unpaidbreaks;
			this._totalworkhours += dayrecord.workhours;
			this._totallates += dayrecord.minslate;
			this._totalmissinglogpenalty += dayrecord.missinglogpenalty;
			
			if (dayrecord.isRestday)
				this._totalrestdayworkhours += dayrecord.workhours;
		});
	}
	
	initializeOutOfOffice(ooologsstr){
		var oooReader = new OutOfOfficeReader(ooologsstr);
		oooReader.parse()
		
		this._ooologs = ooologsstr;
		this._ooorecords = oooReader.ooorecords;
		this._totalnoworkrest = oooReader.totalnoworkrest;
		this._totalholiday = oooReader.totalholiday;
		this._totalleaves = oooReader.totalleaves;
		this._totalserviceleaves = oooReader.totalserviceleaves;
		this._totalsuspension = oooReader.totalsuspension;
	}
	
	update() {
		var str = this.generateSummaryString();
		var p = document.getElementById(this.id);
		p.textContent=str;
		
		var logcols = document.getElementById("logs-"+this.id);
		this.generateFormattedLogs(logcols);
	};

	render() {
		var biologheader = "BIOMETRICS LOGS\n---------------------------\n";
		var biotextcontent = biologheader + this.biologs;	
		var biotextarearowlength = biotextcontent.split("\n").length+2; 
		var oooheader = "OUT-OF-OFFICE\n----------------------------\n"+
			"DATE       HRS\tCODE\n"+
			"----------------------------\n";
		var oootextcontent = oooheader + this.ooologs;		
		var oootextarearowlength = oootextcontent.split("\n").length+1;
		var txlngth = (biotextarearowlength > oootextarearowlength)? 
			biotextarearowlength : oootextarearowlength;
		var wrapper = document.createElement("DIV");
		var biotextarea = document.createElement("TEXTAREA");

		biotextarea.textContent = biotextcontent;
		biotextarea.cols=30;
		biotextarea.rows=txlngth;
		biotextarea.style="resize:vertical; ";
		biotextarea.className="no-print";
		biotextarea.onchange = (e)=> {
			var biologs = e.target.value.substring(biologheader.length); 
			this.initializeAttendance(biologs);
			this.update();
		};
		
		var oootextarea = document.createElement("TEXTAREA");
		oootextarea.textContent = oootextcontent;
		oootextarea.cols=35;
		oootextarea.rows=txlngth;
		oootextarea.style="resize:vertical; outline:none; margin-left: 10px; margin-right: 20px;";
		oootextarea.className="no-print";
		oootextarea.onchange = (e)=> {
			var ooologs = e.target.value.substring(oooheader.length);
			this.initializeOutOfOffice(ooologs);
			this.update();
		};
		
		var pstr = this.generateSummaryString();
		var p = document.createElement("TEXTAREA");
		p.id=this.id; p.cols=90; p.rows=pstr.split("\n").length+3; 
		p.readOnly=true; p.style="resize:none; border:none; outline:none; margin-right: 10px;";
		var ptext = document.createTextNode(pstr);
		p.appendChild(ptext);
		

		var biologtable = document.createElement("DIV");
		biologtable.className = "show-print";
		var biologcolset = document.createElement("DIV");
		biologcolset.id = "logs-"+this.id;
		biologcolset.className = "flex-container";
		biologtable.appendChild(biologcolset);
		this.generateFormattedLogs(biologcolset);
		
		/*var oootable = document.createElement("DIV");
		oootable.className = "show-print";
		var ooota = document.createElement("TEXTAREA");
		ooota.readOnly=true; ooota.style="resize:none; border:none; outline:none;";
		ooota.cols=35; ooota.rows=txlngth;
		var oootext = document.createTextNode(oootextcontent);
		ooota.appendChild(oootext);
		oootable.appendChild(ooota);*/
		
		var header = document.createElement("DIV");
		var title = document.createElement("H2");
		var empObj = this._employee;
		title.textContent= empObj.fullname;
		header.appendChild(title);
		header.style="flex-basis: 100%";
		
		var col1 = document.createElement("DIV");
		var col2 = document.createElement("DIV");
		var col3 = document.createElement("DIV");
		var col4 = document.createElement("DIV");
		col4.className = "flex-container flex-wrap";
		//col4.style = "width: 100%;";
		
		col1.appendChild(biotextarea);
		col2.appendChild(oootextarea);
		col3.appendChild(p);
		col4.appendChild(biologtable);
		//col4.appendChild(oootable);
		
		wrapper.style="display: flex; flex-wrap: wrap; page-break-after: avoid; page-break-inside: avoid;";
		wrapper.appendChild(header);
		wrapper.appendChild(col1);
		wrapper.appendChild(col2);
		wrapper.appendChild(col3);
		wrapper.appendChild(col4);
		this._html = wrapper;
	}
	
	generateFormattedLogs(biologcolset) {
		biologcolset.innerHTML = "";
		Object.keys(this.biologsformatted).forEach((key, counter) => {
			var bldate = key;
			var bltimelog = this.biologsformatted[key];
			var padding = (counter == 0)? "LOGS\n-----------\n" : "\n-----------\n";
			var bltimelogstr = padding + key + "\n-----------\n" + bltimelog.join("\n");
		
			var biologcolumn = document.createElement("DIV");
			
			var biologtextarea = document.createElement("TEXTAREA");
			biologtextarea.readOnly=true; biologtextarea.style="resize:none; border:none; outline:none; ";
			biologtextarea.cols=12; biologtextarea.rows=bltimelog.length+5;
			var bltext = document.createTextNode(bltimelogstr);
			
			biologtextarea.appendChild(bltext);
			biologcolumn.appendChild(biologtextarea);
			biologcolset.appendChild(biologcolumn);
		});
	}
	
	generateOooString() {
		var drdays = Object.entries(this._dayrecords).map(([key, value])=> {return key;}); 
		
		var daysSched = []; 
		this._shiftsdata[0].schedule.forEach((sched)=> {
			daysSched = daysSched.concat(sched.days);
		});
		var datesSched = daterange.filter((date) => {
			return daysSched.includes(moment(new Date(date)).format('ddd'));
		});			
		var dtdiff = datesSched.filter((date) => !drdays.includes(date)); 			
		return dtdiff.join("\n");
	}
	
	generateSummaryString() {
		var totalabsences = 0;
		var hoursperweek = this._employee.shift.hoursPerWeek;
		var diff = (this.totalworkhours + this._totalserviceleaves) - hoursperweek;
		var overtimeHours = (diff > 0)? Utils.round(diff) : this._totalrestdayworkhours;
		var regularworkhours = this.totalworkhours - this._totalrestdayworkhours;	
		var accounted = this._totalleaves + this._totalnoworkrest + 
			this._totalholiday + this._totalsuspension + this._totalserviceleaves;	
			
		var unaccountedHours = (regularworkhours < hoursperweek)?
			Utils.round(hoursperweek - (regularworkhours + accounted)) : 0;
		totalabsences = Utils.round(hoursperweek - regularworkhours);
		
		/*if (diff > 0) { // If has unaccounted absences
			diff = Math.round((diff-accounted) * 100) / 100;
			totalabsences = Math.round((hoursperweek - this.totalworkhours) * 100) / 100;	//this._totalrestdayworkhours
		} else { // If has overtime
			diff = Math.round(Math.abs(diff) * 100) / 100;
		}*/
		var pstr = "WORK HOURS: " + this.totalworkhours + " hrs"+ 
			"\t\tABSENCES: " + totalabsences + " hrs"+
			"\n----------------------------------------------------------------------------------------"+
			"\nDATE\t\t WORK HRS\tIN\tOUT\tDURATION\tLATES (min)\tPENALTY\n"+
			"----------------------------------------------------------------------------------------\n";			
		Object.entries(this._dayrecords).forEach(([key, value])=> {
			pstr += key + " " + daysinaweek[new Date(key).getDay()] + "    ";
			value.attendancelogs.forEach((log, index)=> {
				var arr;
				if (index > 0) { 
					arr = ["\t\t", log.timeinhrs, log.timeouthrs, log.duration];
					pstr += "\t";
				} else {
					arr = [value.workhours + "\t", log.timeinhrs, log.timeouthrs, 
						log.duration, (value.minslate==0)? "\t   " : "\t"+value.minslate, 
						(value.missinglogpenalty==0)?"\t  ":"\t"+currency+value.missinglogpenalty];
				}
				arr.push("\n");
				pstr += arr.join("\t");
			});
		});
		var totallatesinhrs = Math.round((this._totallates/60).toPrecision(12) * 100)/100;
		var combinedLeaves = this._totalserviceleaves +  this._totalleaves;
		pstr+=  "\n----------------------------------------------------------------------------------------" +
				"\nUNACCOUNTED ABSENCES: \t\t" + ((unaccountedHours == 0)? "         " : unaccountedHours + " hrs  ") +
				"\tNO IN/OUT PENALTY: \t" + ((this._totalmissinglogpenalty == 0)? "\t    " : `${currency}${this._totalmissinglogpenalty}`) +
				"\nOVERTIME:             \t\t" + ((overtimeHours == 0)? "         " : overtimeHours + " hrs  ") +
				"\tTOTAL LATES:       \t" + ((this._totallates == 0)? "\t    " : `${totallatesinhrs} hrs`) +
				"\nHOLIDAY: \t\t\t" + ((this._totalholiday == 0)? "" : this._totalholiday + " hrs ") +
				//"\t\tSNACK:             \t" + ((this._totalpaidbreaks == 0)? "\t    " : `${this._totalpaidbreaks} hrs`) +
				"\nLEAVES: \t\t\t" + ((combinedLeaves == 0)? "" : combinedLeaves + " hrs") +
				//"\t\tLUNCH:             \t" + ((this._totalunpaidbreaks == 0)? "\t    " : `${this._totalunpaidbreaks} hrs`) +
				"\nSUSPENSION: \t\t\t" + ((this._totalsuspension == 0)? "" : this._totalsuspension + " hrs") +
				"\nNO WORK/REST DAY:\t\t" + ((this._totalnoworkrest == 0)? "\t    " : this._totalnoworkrest + " hrs     " );
		return pstr;
	}
	
	getJsonObj() {
		return {
			name: this._name.trim(),
			workhours: this._totalworkhours,
			lates: this._totallates,
			noworkrest: this._totalnoworkrest,
			holiday: this._totalholiday,
			leaves: this._totalleaves,
			suspension: this._suspension,
			rawdata: {
				biologs: this.biologs,
				ooologs: this.ooologs,
			}
		};
	}
}

class OutOfOfficeReader {
	constructor(ooologs) {
		this._totalnoworkrest = 0;
		this._totalholiday = 0;
		this._totalleaves = 0;
		this._totalserviceleaves = 0;
		this._totalsuspension = 0;
		this._ooologs = ooologs;
		this._ooorecords = [];
	}
	
	get ooologs() {return this._ooologs;}
	get ooorecords() {return this._ooorecords;}
	get totalnoworkrest() {return this._totalnoworkrest;}
	get totalholiday() {return this._totalholiday;}
	get totalleaves() {return this._totalleaves;}
	get totalserviceleaves() {return this._totalserviceleaves;}
	get totalsuspension() {return this._totalsuspension;}
	
	parse() {
		var arr = this._ooologs.split("\n");
		//arr.shift();arr.shift();arr.shift();arr.shift();
		arr.forEach((log)=> {
			log = log.trim().replace(/\s+/g, " ");
			if (log && log.split(" ").length == 3) {
				var logArr = log.split(" ");
				var date = logArr[0];
				var hrs = logArr[1];
				var code = logArr[2];
				var oooRecord = new OutOfOfficeRecord(date, hrs, code);
				this._ooorecords.push(oooRecord);
				
				if (ooobuckets.noworkrestday.includes(code)) this._totalnoworkrest += parseFloat(hrs);
				else if (ooobuckets.holiday.includes(code)) this._totalholiday += parseFloat(hrs);
				else if (ooobuckets.leaves.includes(code)) this._totalleaves += parseFloat(hrs);
				else if (ooobuckets.serviceleaves.includes(code)) this._totalserviceleaves += parseFloat(hrs);
				else if (ooobuckets.suspension.includes(code)) this._totalsuspension += parseFloat(hrs);
			}
		});
	}
}

class BiometricLogsReader {
	constructor(biologs) {
		this._biologs = biologs;
		this._attendancedayrecords;
	}
	
	get biologs() {return this._biologs;}
	get attendancedayrecords() {return this._attendancedayrecords;}
	get shiftsdata() {return this._shiftsdata;}
	
	parse(employeeShifts, defaultShift, period) {
		this._attendancedayrecords = [];
		var hasNightShift = employeeShifts.filter(shift => 
			shift.schedule.filter(sched => 
				sched.isNightShift).length > 0)
			.length > 0; 
		var tempPeriod = {
			from: period.from, to: period.to
		}
		if (hasNightShift) {
			tempPeriod.to = moment(period.to, 'YYYY/MM/DD')
				.add(1, 'days').format('YYYY/MM/DD');
		}
		
		var biologsArr = this._biologs.split("\n");
		var lastDate = {
			dateStr : null,
			isNightShift : false
		};
		var isNightShiftEnded = false;
		biologsArr.forEach((log, index)=> {
			if (log && log.trim().length > 0) {
				log = log.replace(/\s+/g, " ");
				var split = log.split(" ");
				var date = split[0];
				var time = split[1];
				var datetimestr = date + " " + time;
				var operation = split[2];
				
				var validShifts = ['r', 'm', 'n']; //regular, mid, night
				var shiftkey = (operation) //strip everything, except r, m, and n
					? operation.replace(new RegExp(`[^${validShifts.join('')}]`, 'g'), '*')  
					: defaultShift.key;	//defaults to configured shift not found
				shiftkey = shiftkey.substring(0, 1).replace("*", defaultShift.key);
				
				var datestr = datetimestr.split(" ")[0];
				var datetime = new Date(datetimestr);
				
				var existing = this._attendancedayrecords[datestr];	
				var ignore = (operation == "x")? true : false;
				var ismissing = (operation)? operation.includes("!"): false;
				
				var day = moment(datetime).format('ddd');
				var currentShift = employeeShifts.find((shift)=> shiftkey == shift.key);
				var schedule = currentShift.schedule.find((sched)=> {
					return sched.days.includes(day);
				}); 
				
				// break out of iteration if log has dates that go over the given period
				if (moment(date).isAfter(period.to) 
					&& (schedule && (!schedule.isNightShift | isNightShiftEnded))) return; 
				
				if (!ignore) {				
					if (existing) {
						// If still on the same day, add the time log to the same day record
						existing.addTimelog(datetime, ismissing);
					} else if (lastDate.dateStr && this._attendancedayrecords[lastDate.dateStr] && 
							lastDate.isNightShift && (schedule.isNightShift) && !isNightShiftEnded) {
						// If on a night shift and time log rolls over to the next day,
						// add the time log to the previous day record and end the shift
						this._attendancedayrecords[lastDate.dateStr].addTimelog(datetime, ismissing);
						isNightShiftEnded = true;
					} else {
						// If on a new day (except in the first roll over of the night shift), 
						// create new day record
						var dayRecord = new AttendanceDayRecord(datestr, schedule);
						dayRecord.addTimelog(datetime, ismissing);
						this._attendancedayrecords[datestr] = dayRecord;
						
						if (schedule && schedule.isNightShift)
							isNightShiftEnded = false;
					}
				}
				lastDate.dateStr = datestr;
				lastDate.isNightShift = (schedule)? schedule.isNightShift : false;
			}
		});
	}
}

class EmployeeSettings {
	constructor(employees, shifts) {
		this._employees = employees;
		this._shifts = shifts;
		this._html;
		
		var form = document.getElementById('form-add-employee');
		form.onsubmit = () => { this.addEmployee();};
		
		this.initialize();
	}
	
	get html() {return this._html;}
	get employees() {return this._employees;}
	set employees(employees) {this._employees = employees;}
	
	initialize() {
		this._employees = this._employees.sort((a, b) => {
			return Employee.compare(a, b);
		});
		this.render();
		
		var shiftSelect = document.getElementsByName('shift')[0];
		var submitAdd = document.getElementsByName('submit-add')[0];
		this.populateOptions(shiftSelect);
	}
	
	populateOptions(select, defaultValue) {
		this._shifts.forEach((shift) => {
			var defSel = (defaultValue && defaultValue == shift.name)? true : false;
			var option = new Option(shift.label, shift.name, defSel, defSel);
			option.text = shift.label;
			option.value = shift.name;
			select.add(option);
		});
	}
	
	render() {
		var empTable = document.getElementById("employees");
		var empTableBody = document.getElementById("employees-body");
		empTableBody.innerHTML = '';
		this.employees.forEach( employee => {
			var id = employee.username;
			var row = empTableBody.insertRow(-1);
			var username = row.insertCell(0);
			var fullname = row.insertCell(1);
			var shift = row.insertCell(2);
			var delButton = row.insertCell(3);
		
			var usernameField = document.createElement('INPUT');
			usernameField.setAttribute('type', 'text');
			usernameField.readOnly = true;
			var fullnameField = document.createElement('INPUT');
			fullnameField.setAttribute('type', 'text');
			fullnameField.onchange = (e) => {
				employee.fullname = e.target.value;
				DAO.updateEmployee(employee);
			};
			var shiftSelect = document.createElement('SELECT'); 
			this.populateOptions(shiftSelect, employee.shift.name);
			shiftSelect.onchange = (e) => {
				employee.shift = e.target.value;
				DAO.updateEmployee(employee);
			};
			
			var delIcon = document.createElement('I');
			delIcon.classList.add('hide');
			delIcon.classList.add('fa');
			delIcon.classList.add('fa-trash-o');
			delIcon.classList.add('icon');
			delIcon.classList.add('icon-small');
			delIcon.setAttribute('aria-hidden', 'true');
			delIcon.onclick = () => {
				DAO.deleteEmployee(employee)
					.then(()=> {this.refreshEmployees();});
			};
			delIcon.style.cursor = 'pointer';
		
			usernameField.value = employee.username;
			fullnameField.value = employee.fullname;
			
			username.appendChild(usernameField);
			fullname.appendChild(fullnameField);
			shift.appendChild(shiftSelect);
			delButton.appendChild(delIcon);
		});
		paginator({
			table: empTable,
			box: document.getElementById('employees-box'),
			box_mode: 'list',
			page_options: false
		});
	}
	
	refreshEmployees() { 
		this.employees = DAO.getEmployees();
		this.initialize();
	}
	
	addEmployee() {
		var userid = document.getElementsByName('userid')[0].value;
		var fullname = document.getElementsByName('fullname')[0].value;
		var shift = document.getElementsByName('shift')[0].value;
		
		if (userid && fullname && shift) {
			var employee = new Employee(null, userid, fullname);
			employee.shift = shift;
			
			DAO.addEmployee(employee)
				.then(()=> {this.refreshEmployees();});
			
			document.getElementsByName('userid')[0].value = "";
			document.getElementsByName('fullname')[0].value = "";
		}
	}
}