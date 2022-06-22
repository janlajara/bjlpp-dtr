//const baseUrl = "https://graph.microsoft.com/v1.0/drives/b!yM7Ik58FLke3-nmUNtCY3BxlAEKmmhdMiSNmynXYVcQ8hXSY0BL9SIm95WzGdfVR/items/01BH5UHDGLO2T7VIL3SNHIEWPV2PAFTOCY/workbook/tables";
const baseUrl = "https://graph.microsoft.com/v1.0/drives/b!OK2Dem26gk2Xy80OCJtmwqVJmVXTwo1Cl72tvbfetLar9yYQLjoGRYr9-Nhppfy4/items/01KFRV4PQTKALFFNBBSVDLWFZKEYDQASV7/workbook/tables";

class DataAccess {

	constructor(token) {
		this._token = token;
		this._xlshifts = [];
		this._xlschedules = [];
		this._xltimePeriods = [];
		this._xltimeRules = [];
		this._xlemployees = [];
	}
	
	get config() {return this._xlshifts;}
	get employees() {return this._xlemployees;}
	get shifts() {return this._xlshifts;}
	
	addEmployee(employee) {
		return MSGraph.addEmployee(this._token, employee);
	}
	
	updateEmployee(employee) {
		return MSGraph.patchEmployee(this._token, employee);
	}
	
	deleteEmployee(employee) {
		return MSGraph.deleteEmployee(this._token, employee);
	}
	
	getEmployees() {
		MSGraph.getEmployees(this._token)
			.then( employees => {this._xlemployees = employees;});
		return this._xlemployees;
	}
	
	load(callback) {
		var token = this._token;
		MSGraph.getEmployees(token)
			.then((employees) => { 
				this._xlemployees = employees;})
			.then(
				() => MSGraph.getTimeRules(token).then((timeRules) => {
					return this._xltimeRules = timeRules;}))
			.then(
				() => MSGraph.getTimePeriods(token).then((timePeriods) => {
					return this._xltimePeriods = timePeriods;}))
			.then (() => {
				MSGraph.getSchedules(token)
					.then((schedules) => {
						this._xlschedules = schedules.map((sched)=> {
							var filteredTp = this._xltimePeriods.filter(tp => tp.schedule == sched.name);
							var filteredTr = this._xltimeRules.filter(tr => tr.schedule == sched.name);
							sched.timePeriods = filteredTp;
							sched.timeRules = filteredTr;
							return sched;
						});
						return this._xlschedules;
					})
					.then( () => {
						MSGraph.getShifts(token)
							.then((shifts) => {
								this._xlshifts = shifts.map((shift)=> {
									var filteredEmployees = this._xlemployees.filter(employee => employee.shifts.includes(shift.name));
									var filteredSchedules = this._xlschedules.filter(schedule => schedule.shift == shift.name);
									shift.employees = filteredEmployees;
									shift.schedules = filteredSchedules;
									return shift;
								});
							})
							.then( ()=> {
								this.employees.forEach((employee) => {
									employee.shift = this._xlshifts.find( shift => shift.name == employee.shift );
								});
								callback(this._xlshifts);
							})
					});
			});
	}

}

class MSGraph {

	static getShifts(token) {
		var endpoint = baseUrl + '/Shifts/rows';
		var invoke = function(resolve, reject) {
			MSGraph.get(endpoint, token, (response)=>{
				var shifts = [];
				response.value.forEach((row)=> {
					var cols = row.values[0];
					var name = cols[0];
					var label = cols[1];
					var hoursPerWeek = parseInt(cols[2]);
					var key = cols[3];
					var shift = new Shift(name, label, hoursPerWeek, key);	
					shifts.push(shift);
				});
				resolve(shifts);
				return;
			});
		}
		return new Promise(invoke);
	}
	
	static getSchedules(token, callback) {
		var endpoint = baseUrl + '/ShiftSchedules/rows';
		var invoke = function(resolve, reject) {
			MSGraph.get(endpoint, token, (response)=>{
				var schedules = [];
				response.value.forEach((row)=> {
					var cols = row.values[0];
					var shift = cols[0];
					var name = cols[1];
					var daysString = cols[2];
					var hoursPerDay = parseFloat(cols[3]);
					var isNightShift = (cols[4] && String(cols[4]).toLowerCase() == 'true')? true : false;
					var isRestday = (cols[5] && String(cols[5]).toLowerCase() == 'true')? true : false;
					var daysArr = daysString.split(",").map(day => day.trim());
					var schedule = new Schedule(name, hoursPerDay, shift, isNightShift, isRestday);
					schedule.days = daysArr;
					schedules.push(schedule);
				});
				resolve(schedules);
				return;
			});
		}
		return new Promise(invoke);
	}
	
	static getTimePeriods(token, callback) {
		var endpoint = baseUrl + '/ShiftSchedTime/rows';
		var invoke = function(resolve, reject) {
			MSGraph.get(endpoint, token, (response)=>{
				var timePeriods = [];
				response.value.forEach((row)=> {
					var cols = row.values[0];
					var sched = cols[0];
					var start = cols[1];
					var end = cols[2];
					var isPaid = (cols[3] && String(cols[3]).toLowerCase() == 'true')? true : false;
					var isWorkingHour = (cols[4] && String(cols[4]).toLowerCase() == 'true')? true : false;
					var timePeriod = new TimePeriod(start, end, isPaid, isWorkingHour, sched);
					timePeriods.push(timePeriod);
				});
				resolve(timePeriods);
				return;
			});
		}
		return new Promise(invoke);
	}
	
	static getTimeRules(token) {
		var endpoint = baseUrl + '/ShiftSchedRules/rows';
		var invoke = function(resolve, reject) {
			MSGraph.get(endpoint, token, (response)=>{
				var timeRules = [];
				response.value.forEach((row)=> {
					var cols = row.values[0];
					var sched = cols[0];
					var operation = cols[1];
					var start = cols[2];
					var end = cols[3];
					var replace = cols[4];
					var timeRule = new TimeRule(operation, start, end, replace, sched);
					timeRules.push(timeRule);
				});
				resolve(timeRules);
				return;
			});
		};
		return new Promise(invoke);
	}
	
	static getEmployees(token) {
		var endpoint = baseUrl + '/Users/rows';
		var invoke = function(resolve, reject) {
			MSGraph.get(endpoint, token, (response)=>{
				var employees = [];
				response.value.forEach((row)=> {
					var index = row.index;
					var cols = row.values[0];
					var username = cols[0];
					var fullName = cols[1];
					var shifts = cols[2].split(";");
					var shift = shifts[0];
					
					var employee = new Employee(index, username, fullName);
					employee.shift = shift;
					shifts.forEach((shift)=> {
						employee.addShift(shift.trim());
					});
					employees.push(employee);
				}); 
				resolve(employees);
				return;
			});
		};
		return new Promise(invoke);
	}

	static addEmployee(token, employee) {
		var endpoint = `${baseUrl}/Users/rows/add`;
		var invoke = function(resolve, reject) {
			var body = {
				"values": [[
						employee.username,
						employee.fullname,
						employee.shift
				]]
			};
			MSGraph.post(endpoint, token, (response)=>{
				resolve(response);
			}, body);
		};
		return new Promise(invoke);
	}
	
	static patchEmployee(token, employee) {
		var endpoint = `${baseUrl}/Users/rows/$/ItemAt(index=${employee.index})`;
		var invoke = function(resolve, reject) {
			var body = {
				"values": [[
						employee.username,
						employee.fullname,
						employee.shift
				]]
			};
			MSGraph.patch(endpoint, token, (response)=>{
				//Do nothing
				resolve(response);
			}, body);
		};
		return new Promise(invoke);
	}
	
	static deleteEmployee(token, employee) {
		var endpoint = `${baseUrl}/Users/rows/$/ItemAt(index=${employee.index})`;
		var invoke = function(resolve, reject) {
			MSGraph.xdelete(endpoint, token, (response)=>{
				//Do nothing
				console.log(response);
				resolve(response);
			});
		};
		return new Promise(invoke);
	}
	
	static get(endpoint, token, callback) {
		MSGraph.callApi(endpoint, token, "GET", callback);
	}
	
	static post(endpoint, token, callback, body) {
		MSGraph.callApi(endpoint, token, "POST", callback, body);
	}
	
	static patch(endpoint, token, callback, body) {
		MSGraph.callApi(endpoint, token, "PATCH", callback, body);
	}
	
	static xdelete(endpoint, token, callback, body) {
		MSGraph.callApi(endpoint, token, "DELETE", callback, body);
	}
	
	static callApi(endpoint, token, method, callback, body) {
		const headers = new Headers();
		const bearer = `Bearer ${token}`;

		headers.append("Authorization", bearer);

		var options = {
		  method: method,
		  headers: headers
		};
		if (body) {
			options.body = JSON.stringify(body);
		}
		
		fetch(endpoint, options)
			.then(response => {
				return response.json();
			})
			.then(response => { 
				if (callback) callback(response, endpoint) 
			})
			.catch(error => console.log(error));
	}
}

