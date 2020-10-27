// ==UserScript==
// @name         Work monthly signing
// @match        https://app.factorialhr.com/attendance/clock-in/*
// @require https://ajax.googleapis.com/ajax/libs/jquery/3.4.0/jquery.min.js
// ==/UserScript==

/* global $ */

$(document).ready(function() {

    let currentTime = new Date();
    let currentYear = currentTime.getFullYear();
    let currentMonth = currentTime.getMonth() + 1;
    let employeeId;
    let promises = [];

    appendSigninButtonHtml();
    loadEmployeeId();

    $("#custom-signing").click(function() {
        //clearShifts();
        doSigning();
    });

    function appendSigninButtonHtml() {
        $('body').append(' \
<button id="custom-signing" style="display: none; color: white; font-size:50px; padding-top: 3px; bottom: 30px; position: fixed; right: 100px; z-index: 994; border-radius: 50%; width: 60px; height: 60px; justify-content: center; background-image: linear-gradient(-60deg,#695ee8,#47a7ff);"> \
\u270E \
</button> \
');
    }

    function loadEmployeeId() {
        $.ajax({
            type: "GET",
            url: "https://api.factorialhr.com/attendance/periods?year=" + currentYear + "&month=" + currentMonth,
            xhrFields: { withCredentials: true },
            success : function(data)
            {
                employeeId = data[0].employee_id;
                $('#custom-signing').css('display', 'flex');
            }
        });
    }

    function doSigning() {
        $.ajax({
            type: "GET",
            url: "https://api.factorialhr.com/attendance/periods?year=" + currentYear + "&month=" + currentMonth,
            xhrFields: { withCredentials: true },
            success : function(periods)
            {
                for (var day=1; day<=31; day++) {
                    promises.push(updateShift(periods[0].id, day));
                }
                Promise.all(promises).then(() => location.reload());
            }
        });
    }


    function updateShift(periodId, day) {
        return new Promise((resolve, reject) => {
            let date = new Date(currentYear, (currentMonth - 1), day);

            if(date.getDay() == 6 || date.getDay() == 0) {
                resolve();
                return;
            }

            $.ajax({
                type: "POST",
                url: "https://api.factorialhr.com/attendance/shifts",
                data: {
                    clock_in: '08:00',
                    clock_out: '16:00',
                    day: day,
                    period_id: periodId
                },
                xhrFields: { withCredentials: true },
                success: function (data) {
                    resolve(data)
                }
            });
        });
    }

    function clearShifts() {
        $.ajax({
            type: "GET",
            url: "https://api.factorialhr.com/attendance/shifts?year=" + currentYear + "&month=" + currentMonth + "&employee_id=" + employeeId,
            xhrFields: { withCredentials: true },
            success : function(shifts)
            {
                $(shifts).each(function(){
                    promises.push( deleteShift(this.id));
                });

                Promise.all(promises).then(() => location.reload());
            }
        });
    }

    function deleteShift(shiftId) {
        return new Promise((resolve, reject) => {
            $.ajax({
                type: "DELETE",
                url: "https://api.factorialhr.com/attendance/shifts/" + shiftId,
                xhrFields: { withCredentials: true },
                success: function (data) {
                    resolve(data)
                }
            });
        });
    }
});
