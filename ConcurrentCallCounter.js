/**
 * Call datasets to use:
 * Dataset 1: https://raw.githubusercontent.com/radekzien/Concurrent-Call-Finder/main/CallDataSet1.json
 * Dataset 2: https://raw.githubusercontent.com/radekzien/Concurrent-Call-Counter/refs/heads/main/CallDataSet2.json
 * Dataset 3: https://raw.githubusercontent.com/radekzien/Concurrent-Call-Counter/refs/heads/main/CallDataSet3.json
 */

var callRecords = [];
var results = [];

async function getCallData() {
    const url = '';
    try {
        const response = await fetch(url)
        if(url == ''){
            throw new Error("Please change code to fetch dataset from your url")
        }
        if (!response.ok) {
            throw new Error("Response not OK")
        }
        const json = await response.json()
        callRecords = json.callRecords
        await processData()
        // await POSTResults()
    } catch (error) {
        console.error(error.message)
    }
}

async function POSTResults() {
    const url = ''; // Post results to your URL here
    const jsonResults = JSON.stringify(results)
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: jsonResults
        });
        if (!response.ok) {
            throw new Error("POST Failed " + response.status)
        } else {
            const json = await response.json()
            console.log(json)
        }
    } catch (error) {
        console.error(error.message)
    }
}

async function processData() {
    var callsByDay = {}

    //Group Calls by Customer and Date
    callRecords.forEach(record => {
        let customerID = record.customerId
        let callID = record.callId
        let startTimestamp = record.startTimestamp
        let endTimestamp = record.endTimestamp
        let date = new Date(startTimestamp).toISOString().split("T")[0]

        if (!callsByDay[customerID]) {
            callsByDay[customerID] = {}
        }
        if (!callsByDay[customerID][date]) {
            callsByDay[customerID][date] = []
        }

        callsByDay[customerID][date].push({
            callId: callID,
            startTimeStamp: startTimestamp,
            endTimeStamp: endTimestamp
        })
    })

    //Process Concurrent Calls
    for (let customerId in callsByDay) {
        for (let date in callsByDay[customerId]) {
            let calls = callsByDay[customerId][date]

            //Sort calls by start time
            calls.sort((a, b) => a.startTimeStamp - b.startTimeStamp)

            let concurrentGroups = []
            let currentGroup = {
                callIds: [],
                recentCallStart: null,
                recentCallEnd: null
            }

            calls.forEach(call => {
                if (
                    currentGroup.recentCallEnd !== null &&
                    call.startTimeStamp >= currentGroup.recentCallEnd
                ) {
                    //Save previous group and start a new one
                    concurrentGroups.push({ ...currentGroup })
                    currentGroup = {
                        callIds: [],
                        recentCallStart: null,
                        recentCallEnd: null
                    }
                }

                //Uodate concurrent group
                currentGroup.callIds.push(call.callId)
                currentGroup.recentCallStart = currentGroup.recentCallStart
                    ? Math.min(currentGroup.recentCallStart, call.startTimeStamp)
                    : call.startTimeStamp
                currentGroup.recentCallEnd = currentGroup.recentCallEnd
                    ? Math.max(currentGroup.recentCallEnd, call.endTimeStamp)
                    : call.endTimeStamp
            })

            //Save the last group
            if (currentGroup.callIds.length > 1) {
                concurrentGroups.push({ ...currentGroup })
            }

            //Prepare results
            concurrentGroups.forEach(group => {
                results.push({
                    customerId: customerId,
                    date: date,
                    totalConcurrentCalls: group.callIds.length,
                    callIds: group.callIds
                })
            })
        }
    }

    console.log(results)
}


getCallData()
