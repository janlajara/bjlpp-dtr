# bjlpp-dtr
This is basic app that we use in our business for processing raw data containing attendance logs produced by our biometric attendance machine. 

Our employees clock into an offline standalone machine which identifies the employee via a fingerprint scanner and creates a timestamped record in its storage.
An extract file can be downloaded from the machine then fed into this app for processing and rendering into a presentable format.

I have built this app in middle of 2020 and I have used plain Javascript, HTML and CSS. Its configuration (an Excel file) resides in our Sharepoint site and the app uses [MS Graph API](https://docs.microsoft.com/en-us/graph/use-the-api) to access it. For pagination, I have a used small library called [table-paginator](https://github.com/jamesonmccowan/table-paginator). 

The live site can be viewed [here](https://www.bjlprintingpress.com/utils/dtr/). 
Please note that the app requires a login with an account belonging to our work organization.
