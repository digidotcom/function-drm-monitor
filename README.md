# Azure Digi Remote Manager integration

Handles Digi Remote Manager monitor messages in a POST or PUT API.

Removes the event messages from their envelop and adds them to an Azure
Service Bus Queue for downstream processing by your Azure infrastructure.

Additionally, adds an `simplifiedTopic` attribute to the message that is outgoing 
to the ServiceBus. The simplifiedTopic represents the name of the object that is
the payload in monitor event. Use the simplifiedTopic variable to route, or make 
easy decisions

See the simplified topic section for more information.

## Quick Deploy to Azure

[![Deploy to Azure](http://azuredeploy.net/deploybutton.svg)](https://azuredeploy.net/)

## Digi Remote Manager Instructions

After deploying to Azure, navigate to the new Function App (sometimes called an App Service) using Azure Portal.
Select the drm-monitor function and take note of the API endpoint and the function key code.

The URL with the keycode looks something like this:

```
    https://function-drm-monitorXXXX.azurewebsites.net/api/drm-monitor?code=abcdefghijklmnopqrstuvwxyz
```


Next, create a json monitor in your Digi Remote Manager account using the API endpoint and the `x-functions-key` header specifying the function key code.

Navigate to Digi Remote Manager API Explorer, and select: 
*  Examples -> Cloud Integrations -> Send Events to Azure
  
The following XML is displayed and will define a new monitor:

* Replace the contents of `monTransportUrl`
with your API endpoint and the contents of `monTransportHeaders` with your 
function key code.

* Replace the contents of `monTopic` with the Digi Remote Manager event types 
  that your solution needs.
  
* Adjust the batch size and duration if required

* Note that this monitor does NOT replay events to the target after system downtime. 

  ```
    <Monitor> 
      <monTopic>alert_status,devices</monTopic> 
      <monTransportType>http</monTransportType> 
      <monTransportUrl>https://function-drm-monitorXXXX.azurewebsites.net/api/drm-monitor</monTransportUrl> 
      <monFormatType>json</monFormatType> 
      <monBatchSize>1000</monBatchSize> 
      <monBatchDuration>15</monBatchDuration> 
      <monDescription>Push Monitor for Azure integration</monDescription> 
      <monTransportHeaders>x-functions-key: YOUR-FUNCTION-KEY-CODE</monTransportHeaders> 
      <monTransportMethod>POST</monTransportMethod> 
      <monAutoReplayOnConnect>false</monAutoReplayOnConnect> 
    </Monitor>
  ```
    
* In the Digi Remote Manager API Explorer submit the request.

  * Alternatively, use the XML definition of the monitor as the body for the /ws/Monitor API in Digi Remote Manager using the Digi Remote Manager API Explorer or your favorite web API client. 

  * For example, in Linux or Mac OS, you can use curl to create a DRM Monitor using 
something similar to this (after putting the XML shown above in a file called MonitorPayload.xml)

    ```
    curl -X POST --data @MonitorPayload.xml -u user:password https://remotemanager.digi.com/ws/Monitor 
    ```

## Application settings

Specify these values during deployment:

* The name of the Function App to create (called site name in the deploy). The default name is `function-drm-monitorXXXX`
* The new or existing resource group for created resources. The default is a new resource group named `function-drm-monitorXXXX`
* Where XXXX in the above names are used to help make the global name unique.
  * **NOTE:** Using too long of a name can make the deployment fail.

##### Resources

* The deployment creates additional Asure resources. By default, the resources are named similarly, for example `function-drm-monitorXXXX`.
  * The Resource Group
  * The App Service and App Service Plan 
  * A Storage Account for the Function App files.
  * A ServiceBusNamespace and service bus queue named 'drmposted'

## Simplified Topic

When a Digi Remote Manager event is extracted from the initial monitor payload
and sent to the Service Bus, it includes a topic value.
The topic value is typically used to route requests but contains extraneous 
information that might make the decision harder. 

For example, the topic values for various types of events look like this.

```
    "topic": "00000/DeviceCore/3578622/0"
    "topic": "00000/FileData/db/CUSXXXXXX_BusinessXYZ/Western+Region/Office1"
    "topic": "00000/Group/149837"
    "topic": "00000/devices/00000000-00000000-000000FF-FF000000"
    "topic": "00000/DataPoint/00000000-00000000-000000FF-FF000000/metrics/sys/temperature"
    "topic": "00000/alert_status/41826/aggregate-throttle%2F00000000-00000000-000000FF-FF000000"
    "topic": "00000/DataPoint/00000000-00000000-000000FF-FF000000/metrics/sys/cpu/used"
    "topic": "00000/AlarmStatus/41826/aggregate-throttle%2F00000000-00000000-000000FF-FF000000"
    "topic": "00000/DataPoint/00000000-00000000-000000FF-FF000000/metrics/sys/location"
``` 

In the above examples, `00000` would be the actual Digi Remote Manager customer ID, the `00000000-00000000-000000FF-FF000000` would be the actual device ID, and etc.

This function app takes the 2nd component of the topic and uses that as the value for the `simplifiedTopic` attribute in the message. Makeing decisions based on the topic simpler.

For example:
```
    "simplifiedTopic": "DeviceCore"
    "simplifiedTopic": "FileData"
    "simplifiedTopic": "Group"
    "simplifiedTopic": "devices"
    "simplifiedTopic": "DataPoint"
    "simplifiedTopic": "alert_status"
    "simplifiedTopic": "DataPoint"
    "simplifiedTopic": "AlarmStatus"
    "simplifiedTopic": "DataPoint"
```


## Developing

* Install Azure functions core tools https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local#brew

## Contributors

- Thanks to jefking for initial source
    - https://github.com/jefking/fn-http-queue-s
