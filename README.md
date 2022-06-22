# bjlpp-dtr
This is a basic app that we use in our business for processing raw data containing attendance logs produced by our biometric attendance machine. 

Our employees clock into an offline standalone machine which identifies the employee via their fingerprint and creates a timestamped record in its storage.
An extract file can be downloaded from the machine then fed into this app for processing and rendering into a presentable format.

I've used plain Javascript, HTML and CSS. Its configuration (an Excel file) resides in our Sharepoint site and the app uses [MS Graph API](https://docs.microsoft.com/en-us/graph/use-the-api) to access it. Here is a list of libraries I've used: [table-paginator](https://github.com/jamesonmccowan/table-paginator), [momentjs](https://momentjs.com/), [msal](https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview), [fontawesome](https://fontawesome.com/).

The live site can be viewed [here](https://www.bjlprintingpress.com/utils/dtr/) but it requires a login using an account belonging to our work organization.

**I've built this quick-and-dirty prototype in the middle of 2020. I might do a complete overhaul of everything when I get the chance.*
