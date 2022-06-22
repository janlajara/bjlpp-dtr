const time = {
	"in": "in",
	"out": "out"
};
const mapping = {
	bio1: {
		"name": 3,
		"datetime": 4
	},
	bio2: {
		"name": 3,
		"datetime": 6
	}
};
const currency = "₱";
const penaltyrate = 3;	
const daysinaweek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ooobuckets = {
	noworkrestday: ["NW", "RD"],
	holiday: ["HD"],
	leaves: ["VL", "SL"],
	serviceleaves: ["SIL"],
	suspension: ["SP"],
};
var shiftsdata; /*= [
	{
		name: "bjlpp1",
		users: ["allan", "eljay", "domeng", "girlie", "jane", "jonabelle", "kay", "leo", 
			"marianne", "maricel", "mer", "mhel", "michael", "rose ann", "ryan", "sherryl"],
		hoursperweek: 48,
		schedule: [
			{
				days: ["Mon", "Tue", "Wed", "Thu"],
				hours: 10,
				time: [
					{start: "7:00", end: "9:00", isPaid: true, isWorkingHour: true},
					{start: "9:00", end: "9:15", isPaid: true, isWorkingHour: false},
					{start: "9:15", end: "12:00", isPaid: true, isWorkingHour: true},
					{start: "12:00", end: "13:00", isPaid: false, isWorkingHour: false},
					{start: "13:00", end: "15:00", isPaid: false, isWorkingHour: true},
					{start: "15:00", end: "15:15", isPaid: true, isWorkingHour: false},
					{start: "15:15", end: "18:00", isPaid: true, isWorkingHour: true}],
				timerules: {
					timein: [
						{start:"4:00", end: "6:59", replace: "07:00"},		
						{start:"9:01", end: "9:14", replace: "09:15"},		
						{start:"12:01", end: "12:59", replace: "13:00"},	
						{start:"15:01", end: "15:14", replace: "15:15"}, 	
					],
					timeout: [
						{start:"4:00", end: "6:59", replace: "07:00"},	
						{start:"9:01", end: "9:14", replace: "09:00"},		
						{start:"12:01", end: "12:59", replace: "12:00"},	
						{start:"15:01", end: "15:14", replace: "15:00"},	
						{start:"18:01", end: "18:29", replace: "18:00"},	
						{start:"18:30", end: "18:59", replace: "18:30"},	
						{start:"19:01", end: "19:29", replace: "19:00"},	
						{start:"19:30", end: "19:59", replace: "19:30"},	
						{start:"20:01", end: "20:29", replace: "20:00"},	
						{start:"20:30", end: "20:59", replace: "20:30"},
					]
				}
			},{
				days: ["Fri"],
				hours: 8,
				time: [
					{start: "7:00", end: "9:00", isPaid: true, isWorkingHour: true},
					{start: "9:00", end: "9:15", isPaid: true, isWorkingHour: false},
					{start: "9:15", end: "12:00", isPaid: true, isWorkingHour: true},
					{start: "12:00", end: "13:00", isPaid: false, isWorkingHour: false},
					{start: "13:00", end: "15:00", isPaid: false, isWorkingHour: true},
					{start: "15:00", end: "15:15", isPaid: true, isWorkingHour: false},
					{start: "15:15", end: "16:00", isPaid: true, isWorkingHour: true}],
				timerules: {
					timein: [
						{start:"4:00", end: "6:59", replace: "07:00"},		
						{start:"9:01", end: "9:14", replace: "09:15"},		
						{start:"12:01", end: "12:59", replace: "13:00"},	
						{start:"15:01", end: "15:14", replace: "15:15"}, 	
					],
					timeout: [
						{start:"4:00", end: "6:59", replace: "07:00"},	
						{start:"9:01", end: "9:14", replace: "09:00"},		
						{start:"12:01", end: "12:59", replace: "12:00"},	
						{start:"15:01", end: "15:14", replace: "15:00"},		
						{start:"16:01", end: "16:29", replace: "16:00"},
						{start:"16:30", end: "16:59", replace: "16:30"},	
						{start:"18:01", end: "18:29", replace: "18:00"},	
						{start:"18:30", end: "18:59", replace: "18:30"},	
						{start:"19:01", end: "19:29", replace: "19:00"},	
						{start:"19:30", end: "19:59", replace: "19:30"},	
						{start:"20:01", end: "20:29", replace: "20:00"},	
						{start:"20:30", end: "20:59", replace: "20:30"},
					]
				}
			}
		],
	},{
		name: "bjlpp2",
		users: ["roger"],
		hoursperweek: 48,
		schedule: [
			{
				days: ["Mon", "Tue", "Wed", "Thu"],
				hours: 10,
				time: [
					{start: "7:00", end: "9:00", isPaid: true, isWorkingHour: true},
					{start: "9:00", end: "9:15", isPaid: true, isWorkingHour: false},
					{start: "9:15", end: "12:00", isPaid: true, isWorkingHour: true},
					{start: "12:00", end: "13:00", isPaid: false, isWorkingHour: false},
					{start: "13:00", end: "15:00", isPaid: false, isWorkingHour: true},
					{start: "15:00", end: "15:15", isPaid: true, isWorkingHour: false},
					{start: "15:15", end: "18:00", isPaid: true, isWorkingHour: true}],
				timerules: {
					timein: [
						{start:"4:00", end: "6:29", replace: "06:00"},	
						{start:"6:30", end: "6:59", replace: "07:00"},							
						{start:"9:01", end: "9:14", replace: "09:15"},		
						{start:"12:01", end: "12:59", replace: "13:00"},	
						{start:"15:01", end: "15:14", replace: "15:15"}, 	
					],
					timeout: [
						{start:"4:00", end: "5:59", replace: "06:00"},	
						{start:"6:00", end: "6:59", replace: "07:00"},	
						{start:"9:01", end: "9:14", replace: "09:00"},		
						{start:"12:01", end: "12:59", replace: "12:00"},	
						{start:"15:01", end: "15:14", replace: "15:00"},	
						{start:"18:01", end: "18:29", replace: "18:00"},	
						{start:"18:30", end: "18:59", replace: "18:30"},	
						{start:"19:01", end: "19:29", replace: "19:00"},	
						{start:"19:30", end: "19:59", replace: "19:30"},	
						{start:"20:01", end: "20:29", replace: "20:00"},	
						{start:"20:30", end: "20:59", replace: "20:30"},
					]
				}
			},{
				days: ["Fri"],
				hours: 8,
				time: [
					{start: "7:00", end: "9:00", isPaid: true, isWorkingHour: true},
					{start: "9:00", end: "9:15", isPaid: true, isWorkingHour: false},
					{start: "9:15", end: "12:00", isPaid: true, isWorkingHour: true},
					{start: "12:00", end: "13:00", isPaid: false, isWorkingHour: false},
					{start: "13:00", end: "15:00", isPaid: false, isWorkingHour: true},
					{start: "15:00", end: "15:15", isPaid: true, isWorkingHour: false},
					{start: "15:15", end: "16:00", isPaid: true, isWorkingHour: true}],
				timerules: {
					timein: [
						{start:"4:00", end: "6:29", replace: "06:00"},	
						{start:"6:30", end: "6:59", replace: "07:00"},		
						{start:"9:01", end: "9:14", replace: "09:15"},		
						{start:"12:01", end: "12:59", replace: "13:00"},	
						{start:"15:01", end: "15:14", replace: "15:15"}, 	
					],
					timeout: [
						{start:"4:00", end: "6:29", replace: "06:00"},	
						{start:"6:30", end: "6:59", replace: "07:00"},	
						{start:"9:01", end: "9:14", replace: "09:00"},		
						{start:"12:01", end: "12:59", replace: "12:00"},	
						{start:"15:01", end: "15:14", replace: "15:00"},		
						{start:"16:01", end: "16:29", replace: "16:00"},
						{start:"16:30", end: "16:59", replace: "16:30"},	
						{start:"18:01", end: "18:29", replace: "18:00"},	
						{start:"18:30", end: "18:59", replace: "18:30"},	
						{start:"19:01", end: "19:29", replace: "19:00"},	
						{start:"19:30", end: "19:59", replace: "19:30"},	
						{start:"20:01", end: "20:29", replace: "20:00"},	
						{start:"20:30", end: "20:59", replace: "20:30"},
					]
				}
			}
		],
	}, {
		name: "gemcarl1",
		users: ["rose"],
		hoursperweek: 48,
		schedule: [
			{
				days: ["Mon", "Tue", "Wed", "Thu"],
				hours: 9,
				time: [
					{start: "7:00", end: "9:00", isPaid: true, isWorkingHour: true},
					{start: "9:00", end: "9:15", isPaid: true, isWorkingHour: false},
					{start: "9:15", end: "12:00", isPaid: true, isWorkingHour: true},
					{start: "12:00", end: "13:00", isPaid: false, isWorkingHour: false},
					{start: "13:00", end: "15:00", isPaid: false, isWorkingHour: true},
					{start: "15:00", end: "15:15", isPaid: true, isWorkingHour: false},
					{start: "15:15", end: "17:00", isPaid: true, isWorkingHour: true}],
				timerules: {
					timein: [
						{start:"4:00", end: "6:59", replace: "07:00"},		
						{start:"9:01", end: "9:14", replace: "09:15"},		
						{start:"12:01", end: "12:59", replace: "13:00"},	
						{start:"15:01", end: "15:14", replace: "15:15"}, 	
					],
					timeout: [
						{start:"4:00", end: "6:59", replace: "07:00"},	
						{start:"9:01", end: "9:14", replace: "09:00"},		
						{start:"12:01", end: "12:59", replace: "12:00"},	
						{start:"15:01", end: "15:14", replace: "15:00"},	
						{start:"17:01", end: "17:29", replace: "17:00"},	
						{start:"17:30", end: "17:59", replace: "17:30"},	
						{start:"18:01", end: "18:29", replace: "18:00"},	
						{start:"18:30", end: "18:59", replace: "18:30"},	
						{start:"19:01", end: "19:29", replace: "19:00"},	
						{start:"19:30", end: "19:59", replace: "19:30"},	
						{start:"20:01", end: "20:29", replace: "20:00"},	
						{start:"20:30", end: "20:59", replace: "20:30"},
					]
				}
			},{
				days: ["Fri"],
				hours: 8,
				time: [
					{start: "7:00", end: "9:00", isPaid: true, isWorkingHour: true},
					{start: "9:00", end: "9:15", isPaid: true, isWorkingHour: false},
					{start: "9:15", end: "12:00", isPaid: true, isWorkingHour: true},
					{start: "12:00", end: "13:00", isPaid: false, isWorkingHour: false},
					{start: "13:00", end: "15:00", isPaid: false, isWorkingHour: true},
					{start: "15:00", end: "15:15", isPaid: true, isWorkingHour: false},
					{start: "15:15", end: "16:00", isPaid: true, isWorkingHour: true}],
				timerules: {
					timein: [
						{start:"4:00", end: "6:59", replace: "07:00"},		
						{start:"9:01", end: "9:14", replace: "09:15"},		
						{start:"12:01", end: "12:59", replace: "13:00"},	
						{start:"15:01", end: "15:14", replace: "15:15"}, 	
					],
					timeout: [
						{start:"4:00", end: "6:59", replace: "07:00"},	
						{start:"9:01", end: "9:14", replace: "09:00"},		
						{start:"12:01", end: "12:59", replace: "12:00"},	
						{start:"15:01", end: "15:14", replace: "15:00"},		
						{start:"16:01", end: "16:29", replace: "16:00"},
						{start:"16:30", end: "16:59", replace: "16:30"},
						{start:"17:01", end: "17:29", replace: "17:00"},	
						{start:"17:30", end: "17:59", replace: "17:30"},	
						{start:"18:01", end: "18:29", replace: "18:00"},	
						{start:"18:30", end: "18:59", replace: "18:30"},
					]
				}
			},{
				days: ["Sat"],
				hours: 4,
				time: [
					{start: "8:00", end: "9:00", isPaid: true, isWorkingHour: true},
					{start: "9:00", end: "9:15", isPaid: true, isWorkingHour: false},
					{start: "9:15", end: "12:00", isPaid: true, isWorkingHour: true}],
				timerules: {
					timein: [
						{start:"4:00", end: "6:59", replace: "07:00"},		
						{start:"9:01", end: "9:14", replace: "09:15"},		
						{start:"12:01", end: "12:59", replace: "13:00"},	
						{start:"15:01", end: "15:14", replace: "15:15"}, 	
					],
					timeout: [
						{start:"4:00", end: "6:59", replace: "07:00"},	
						{start:"9:01", end: "9:14", replace: "09:00"},		
						{start:"12:01", end: "12:59", replace: "12:00"},	
						{start:"15:01", end: "15:14", replace: "15:00"},	
						{start:"16:01", end: "16:29", replace: "16:00"},
						{start:"16:30", end: "16:59", replace: "16:30"},		
						{start:"17:01", end: "17:29", replace: "17:00"},	
						{start:"17:30", end: "17:59", replace: "17:30"},	
						{start:"18:01", end: "18:29", replace: "18:00"},	
						{start:"18:30", end: "18:59", replace: "18:30"},	
						{start:"19:01", end: "19:29", replace: "19:00"},	
						{start:"19:30", end: "19:59", replace: "19:30"},	
						{start:"20:01", end: "20:29", replace: "20:00"},	
						{start:"20:30", end: "20:59", replace: "20:30"},
					]
				}
			}
		],
	},{
		name: "gemcarl2",
		users: ["jonathan", "pong"],
		hoursperweek: 48,
		schedule: [
			{
				days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
				hours: 8,
				time: [
					{start: "8:00", end: "9:00", isPaid: true, isWorkingHour: true},
					{start: "9:00", end: "9:15", isPaid: true, isWorkingHour: false},
					{start: "9:15", end: "12:00", isPaid: true, isWorkingHour: true},
					{start: "12:00", end: "13:00", isPaid: false, isWorkingHour: false},
					{start: "13:00", end: "15:00", isPaid: false, isWorkingHour: true},
					{start: "15:00", end: "15:15", isPaid: true, isWorkingHour: false},
					{start: "15:15", end: "17:00", isPaid: true, isWorkingHour: true},
				],
				timerules: {
					timein: [
						{start:"4:00", end: "7:59", replace: "08:00"},	
					],
					timeout: [		
						{start:"17:01", end: "17:29", replace: "17:00"},	
						{start:"17:30", end: "17:59", replace: "17:30"},	
						{start:"18:01", end: "18:29", replace: "18:00"},	
						{start:"18:30", end: "18:59", replace: "18:30"},	
						{start:"19:01", end: "19:29", replace: "19:00"},	
						{start:"19:30", end: "19:59", replace: "19:30"},	
						{start:"20:01", end: "20:29", replace: "20:00"},	
						{start:"20:30", end: "20:59", replace: "20:30"},	
					]
				}
			}
		]
	}
];*/