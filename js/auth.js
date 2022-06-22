const msalConfig = {
	auth: {
		clientId: 'eb5555d0-a1b7-4c56-bf91-7f29b079e7a0',
		authority: 'https://login.microsoftonline.com/40f3b91a-4d91-4878-bee0-65fa2f7dbeed'
	}
};
const msalInstance = new Msal.UserAgentApplication(msalConfig);
var loginRequest = {
   scopes: ["user.read", "mail.send", "files.readwrite.all"] 
};
var DAO;

function signIn() {
	msalInstance.loginPopup(loginRequest)
        .then(response => {
            checkSession();
        })
        .catch(err => {
            // handle error
			console.log(err);
        });
}

function signOut() {
	msalInstance.logout();
}

function checkSession() {
	var form = document.getElementById('importForm'); 
	var settingsButton = document.getElementById('headerButtons');
	var signInButton = document.getElementById('auth');
	var accountName = document.getElementById('profile-name');
	var account = msalInstance.getAccount();
	
	if (account) {
		accountName.textContent = account.name;
	
		form.classList.remove('hide');
		settingsButton.classList.remove('hide');
		signInButton.classList.add('hide');
		
		getToken();
		
	} else {
		form.classList.add('hide');
		settingsButton.classList.add('hide');
		signInButton.classList.remove('hide');
	}
}

function getToken() {
	var tokenRequest = {
		scopes: ["user.read", "files.read", "files.read.all"]
	};
	msalInstance.acquireTokenSilent(tokenRequest)
		.then(response => {
			initializeSettings(response.accessToken);
		})
		.catch(err => {
			// could also check if err instance of InteractionRequiredAuthError if you can import the class.
			if (err.name === "InteractionRequiredAuthError") {
				return msalInstance.acquireTokenPopup(tokenRequest)
					.then(response => {
						// get access token from response
						// response.accessToken
						initializeSettings(response.accessToken);
					})
					.catch(err => {
						// handle error
					});
			}
		});
}

function initializeSettings(token) {
	DAO = new DataAccess(token);
	var loader = document.getElementsByClassName('settings-load-wrapper')[0];
	var settings = document.getElementsByClassName('settings-content')[0];
	DAO.load((config) => {
		shiftsdata = config.map(shift => shift.toJson());
		CONFIG.shifts = config;
		CONFIG.employees = DAO.employees;
		var employeeSettings = new EmployeeSettings(DAO.employees, DAO.shifts);
		settings.classList.remove('disable');
		loader.classList.add('hide');
	});
}

window.onload = checkSession;