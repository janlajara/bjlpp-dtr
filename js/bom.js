class OutOfOfficeRecord {
	constructor(date, hrs, code) {
		this._date = date;
		this._hrs = hrs;
		this._code = code;
	}
}	

class AttendanceLog {
	constructor(timerules) { 
		this._originaltimein;
		this._originaltimeout;
		this._inroundoff = false;
		this._outroundoff = false;
		this._timerules = timerules;
		this._ismissing = {
			timein: false,
			timeout: false
		};
	}
	get ismissing() {return this._ismissing;}
	set ismissingin(ismissing) {
		this._ismissing.timein = ismissing;
	}
	set ismissingout(ismissing) {
		this._ismissing.timeout = ismissing;
	}
	get timerules() {return this._timerules;}
	set timerules(timerules) {
		this._timerules = timerules;
	}
	get inroundoff() {return this._inroundoff;}
	set inroundoff(inroundoff) {this._inroundoff = inroundoff;}
	get outroundoff() {return this._outroundoff;}
	set outroundoff(outroundoff) {this._outroundoff = outroundoff;}
	get timein() {
		return (this._inroundoff)? this._timein : this._originaltimein;
	}
	set timein(timein) {
		this._originaltimein = timein;
		var roundedOff = this.roundOff(timein, time.in);
		this._timein = roundedOff;
	}
	get timeout() {
		return (this._outroundoff)? this._timeout : this._originaltimeout;
	}
	set timeout(timeout) {
		this._originaltimeout = timeout;
		var roundedOff = this.roundOff(timeout, time.out);
		this._timeout = roundedOff;
	}
	get timeinhrs() {
		var timein = AttendanceLog.format(this.timein);
		if (this._inroundoff) timein += "*";
		return timein;}
	get timeouthrs() {
		if (this.timeout) {
			var timeout = AttendanceLog.format(this.timeout);
			if (this._outroundoff) timeout += "*";
			return timeout;
		} else return "    ";}
	get duration() { 
		if (this.timein && this.timeout) {
			var hrs = (Math.abs(this.timeout - this.timein) / (1000 * 60 * 60))
			return Math.round(hrs * 100) / 100;
		} else {
			return 0;
		}
	}
	roundOff(date, operation) { 
		var rules = [];
		if (this.timerules) {
			rules = (operation == time.in)? 
				this.timerules.timein : this.timerules.timeout; 
		}
		var mins = AttendanceLog.minutesOfDay(date); 
		var datestr = [date.getFullYear(), AttendanceLog.pad(date.getMonth()+1, 2), 
			AttendanceLog.pad(date.getDate(), 2)].join("-");
		rules.some((rule)=> {
			var start = AttendanceLog.mins(rule.start);
			var end = AttendanceLog.mins(rule.end);
			var threshold = end - start;
			if (mins<=end && (end-mins) >=0 && (end-mins) <= threshold) { 
				date = new Date(datestr+"T"+rule.replace); 
				if (operation == time.in) this._inroundoff = true;
				else this._outroundoff = true;
				return true;
			}
		}); 
		return date;
	}
	static format(date){
		return AttendanceLog.pad(date.getHours(),2) + ":" + AttendanceLog.pad(date.getMinutes(), 2);
	}
	static pad(num, size) {
		var s = "00000"+num;
		return s.substr(s.length-size);
	}
	static minutesOfDay(date) {
		return date.getMinutes() + (date.getHours() * 60);
	}
	static mins(timestr) {
		var arr = timestr.split(":");
		var hr = parseInt(arr[0]);
		var min = parseInt(arr[1]);
		return hr*60 + min;
	}
	static getDuration(starttime, endtime) {
		var start = moment(starttime, "H:mm");
		var end = moment(endtime, "H:mm");
		var duration = moment.duration(end.diff(start));
		var hours = parseFloat(duration.asHours());
		return hours;
	}
}

class AttendanceDayRecord {
	constructor(date, schedule) {	
		this._date = date;
		this._attendancelogs = [];
		if (schedule) {
			this._timerules = schedule.timerules;
			this._scheduletime = schedule.time;
			this._isRestday = schedule.isRestday;
		}
	}
	get isRestday() {return this._isRestday;}
	get date() {return this._date;}
	set date(date) {this._date = date;}
	get attendancelogs() {
		return this._attendancelogs;
	}
	get workhours() {
		var total = 0;
		this.attendancelogs.forEach((log)=> {
			total += log.duration;
		});
		total += this.getAdjustment();
		return Math.round(total * 100) / 100;
	}
	get paidbreaks() {
		return this.getBreaks(true);
	}
	get unpaidbreaks() {
		return this.getBreaks(false);
	}
	get minslate() {
		var lates = 0;
		if (this._scheduletime && this._scheduletime[0] && this.attendancelogs && this.attendancelogs.length > 0) {
			var schedulestart = this._scheduletime[0].start;
			var targettime = AttendanceLog.mins(schedulestart);
			var actualtime = AttendanceLog.minutesOfDay(this.attendancelogs[0].timein);
			lates = (targettime < actualtime)? actualtime - targettime : 0; 
		}
		return lates;
	}
	get missinglogpenalty() {
		var penaltyCounter = 0;
		var logs = this._attendancelogs.forEach((log)=> {
			if (log.ismissing && (log.ismissing.timein || log.ismissing.timeout)) {
				var points = (log.ismissing.timein && log.ismissing.timeout)? 2 : 1;
				penaltyCounter += points;
			}
		});
		var penalty = penaltyCounter * penaltyrate * 5;
		return penalty;
	}
	getFirst() {return this.attendancelogs[0];}
	getLast() {return this.attendancelogs[this.attendancelogs.length-1];}
	
	getAdjustment() {
		var adjustment = 0;	
		adjustment += this.getBreaks(true, true);
		adjustment -= this.getBreaks(false, true);
		return adjustment;
	}
	
	getBreaks(isPaid, getAdjustmentValue) { 
		if (getAdjustmentValue == null) getAdjustmentValue = false;
		var breaks = 0;
		if (this._scheduletime) {
			var schedBreaks = this._scheduletime.filter((time) => {
				var condition1 = (isPaid)? 
					!time.isWorkingHour && time.isPaid:
					!time.isWorkingHour && !time.isPaid;
				
				var nearestBefore = this.attendancelogs.find((log) => {
					var scheduledStart = moment(time.start, 'H:mm');
					var actualTimeout = moment(moment(log.timeout).format('H:mm'), 'H:mm');
					return actualTimeout.isSameOrBefore(scheduledStart);
				}); 
				var nearestAfter = this.attendancelogs.find((log) => {
					var scheduledEnd = moment(time.end, 'H:mm');
					var actualStart = moment(moment(log.timein).format('H:mm'), 'H:mm');
					return scheduledEnd.isSameOrBefore(actualStart);
				}); 
				var isAfterFirstTimein = moment(time.start, 'H:mm').isSameOrAfter(
					moment(moment(this.getFirst().timein).format('H:mm'), 'H:mm'));
				var isBeforeLastTimeout = moment(time.end, 'H:mm').isSameOrBefore(
					moment(moment(this.getLast().timeout).format('H:mm'), 'H:mm'));
				var isWithinLoggedHours = isAfterFirstTimein && isBeforeLastTimeout;

				var nearestLogsFound = nearestBefore != null && nearestAfter != null;
				if (getAdjustmentValue) {
					var condition2 = ((nearestLogsFound && isPaid) || 
						(!nearestLogsFound && isWithinLoggedHours && !isPaid));
					return condition1 && condition2;
				} else {return condition1 && isWithinLoggedHours;}
			});   
			schedBreaks.forEach((sched)=> {
				breaks += AttendanceLog.getDuration(sched.start, sched.end);
			});	
		}			
		return breaks;
	}
	
	addTimelog(datetime, ismissing) {
		var last = this.getLast();
		if (last && last.timeout == null) {
			last.timeout = datetime;
			last.ismissingout = ismissing;
		} else {
			var attendanceLog = new AttendanceLog(this._timerules);
			attendanceLog.timein = datetime;
			attendanceLog.ismissingin = ismissing;
			this._attendancelogs.push(attendanceLog);
		}
	}
	
	applyCustomRules() {
	
		// Rule: If employee time-ins during a paid break, do not round off
		if (this.attendancelogs) {
			var firstLog = this.getFirst();
			if (firstLog && firstLog.inroundoff == true) {
				var paidBreak = this._scheduletime.find((time) => {
					var firstTimeIn = moment(moment(firstLog._originaltimein).format('H:mm'), 'H:mm');
					var scheduledStart = moment(time.start, 'H:mm');
					var scheduledEnd = moment(time.end, 'H:mm');
					var isPaidBreak = !time.isWorkingHour && time.isPaid;
					var isTimeinWithinPaidBreak = firstTimeIn.isAfter(scheduledStart) && 
						firstTimeIn.isBefore(scheduledEnd);
					return isPaidBreak && isTimeinWithinPaidBreak;
				});
				var firstTimeInDuringPaidBreak = paidBreak != null;
				if (firstTimeInDuringPaidBreak)	 //Reverse the rounding off made earlier
					firstLog.inroundoff = false; //Do not round off if employee logs-in during paid break
			}
		}
		
	}
	
	toString() {
		return this.attendancelogs.map((log)=> {return log.toString()});
	}
}


class Employee {
	constructor(index, username, fullname) {
		this._index = index;
		this._username = username;
		this._fullname = fullname;
		this._shift;
		this._shifts = [];
	}
	get index() {return this._index;}
	get username() {return this._username;}
	set username(username) {this._username = username;}
	get fullname() {return this._fullname;}
	set fullname(fullname) {this._fullname = fullname;}
	get shift() {return this._shift;}
	set shift(shift) {this._shift = shift;}
	get shifts() {return this._shifts;}
	
	addShift(shift) {
		this.shifts.push(shift);
	}
	
	static compare(employee1, employee2) {
		const e1 = employee1.fullname.toUpperCase();
		const e2 = employee2.fullname.toUpperCase();
		let comparison = 0;
		if (e1 > e2) {
			comparison = 1;
		} else if (e1 < e2) {
			comparison = -1;
		}
		return comparison;
	}
}

class Shift {
	constructor(name, label, hoursPerWeek, key) {
		this._name = name;
		this._label = label;
		this._hoursPerWeek = hoursPerWeek;
		this._key = key;
		this._employees = [];
		this._schedules = [];
	}
	get key() {return this._key;}
	get name() {return this._name;}
	get label() {return this._label;}
	get hoursPerWeek() {return this._hoursPerWeek;}
	set hoursPerWeek(hoursPerWeek) {this._hoursPerWeek = hoursPerWeek;}
	get employees() {return this._employees;}
	set employees(employees) {this._employees = employees;}
	get schedules() {return this._schedules;}
	set schedules(schedules) {this._schedules = schedules;}
	
	addEmployee(employee) {
		this.employees.push(employee);
	}
	addSchedule(schedule) {
		this.schedules.push(schedule);
	}
	
	toJson() {
		return {
			name: this.name,
			key: this.key,
			users: this.employees.map((employee)=> {
				return employee.username;
			}),
			hoursperweek: this.hoursPerWeek,
			schedule: this.schedules.map((schedule)=> {
				return schedule.toJson();
			})
		};
	}
}

class Schedule {
	constructor(name, hoursPerDay, shift, isNightShift, isRestday) {
		this._name = name;
		this._hoursPerDay = hoursPerDay;
		this._days = [];
		this._timePeriods = [];
		this._timeRules = [];
		this._shift = shift;
		this._isNightShift = isNightShift;
		this._isRestday = isRestday;
	}
	get name() {return this._name;}
	get shift() {return this._shift;}
	get days() {return this._days;}
	set days(days) {this._days = days;}
	get timePeriods() {return this._timePeriods;}
	set timePeriods(timePeriods) {this._timePeriods = timePeriods;}
	get timeRules() {return this._timeRules;}
	set timeRules(timeRules) {this._timeRules = timeRules;}
	get hoursPerDay() {return this._hoursPerDay;}
	set hoursPerDay(hoursPerDay) {this._hoursPerDay = hoursPerDay;}
	get isNightShift() {return this._isNightShift;}
	set isNightShift(isNightShift) {this._isNightShift = isNightShift;}
	get isRestday() {return this._isRestday;}
	set isRestday(isRestday) {this._isRestday = isRestday;}
	
	addDays(day) {
		this.days.push(day);
	}
	
	addTimePeriod(timePeriod) {
		this.timePeriods.push(timePeriod);
	}
	
	addTimeRule(timeRule) {
		this.timeRules.push(timeRule);
	}
	
	toJson() {
		var timeins = this.timeRules.filter(timeRule => timeRule.operation == "IN");
		var timeouts = this.timeRules.filter(timeRule => timeRule.operation == "OUT");
		return {
			days: this.days,
			hours: this.hoursPerDay,
			isNightShift: this.isNightShift,
			isRestday: this.isRestday,
			time: this.timePeriods.map((period)=> {
				return period.toJson();
			}),
			timerules: {
				timein: timeins.map(timerule => timerule.toJson()),
				timeout: timeouts.map(timerule => timerule.toJson())
			}
		};
	}
}

class TimePeriod {
	constructor(start, end, isPaid, isWorkingHour, schedule) {
		this._start = start;
		this._end = end;
		this._isPaid = isPaid;
		this._isWorkingHour = isWorkingHour;
		this._schedule = schedule;
	}
	get schedule() {return this._schedule;}
	get start() {return this._start;}
	set start(start) {this._start = start;}
	get end() {return this._end;}
	set end(end) {this._end = end;}
	get isPaid() {return this._isPaid;}
	set isPaid(isPaid) {this._isPaid = isPaid;}
	get isWorkingHour() {return this._isWorkingHour;}
	set isWorkingHour(isWorkingHour) {this._isWorkingHour = isWorkingHour;}
	
	
	toJson() {
		return {
			start: this.start, end: this.end, 
			isPaid: this.isPaid, isWorkingHour: this.isWorkingHour
		};
	}
}

class TimeRule {
	constructor(operation, start, end, replace, schedule) {
		this._operation = operation;
		this._start = start;
		this._end = end;
		this._schedule = schedule;
		this.replace = replace;
	}
	get schedule() {return this._schedule;}
	get operation() {return this._operation;}
	set operation(operation) {this._operation = operation;}
	get start() {return this._start;}
	set start(start) {this._start = start;}
	get end() {return this._end;}
	set end(end) {this._end = end;}
	get replace() {return this._replace;}
	set replace(replace) {
		this._replace = TimeRule.zeroFill(replace, 5);
	}
	
	toJson() {
		return {
			start: this.start,
			end: this.end,
			replace: this.replace
		};
	}
	
	static zeroFill(number, width){
		width -= number.toString().length;
		if ( width > 0 ){
		return new Array( width + (/\./.test( number ) ? 2 : 1) ).join( '0' ) + number;
		}
		return number + ""; 
	}
}