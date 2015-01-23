$(function () {
    $.mobile.defaultHomeScroll = 0;
});

jQuery.support.cors = true;
$.ajaxSetup({
    cache: false
});

// To debug code on page load launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
    "use strict";
    document.addEventListener('deviceready', onDeviceReady.bind(this), false);

    function onDeviceReady() {
        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);

        //check Platform 
        $('#Platform').html(device.platform);

        // Android customization - necessary
        //cordova.plugins.backgroundMode.setDefaults({ title: 'SRA', text: 'SRA - Running in backgroud!' });
        // Enable background mode
        //cordova.plugins.backgroundMode.enable();

        // Called when background mode has been activated
        //cordova.plugins.backgroundMode.onactivate = function () {
        //    setTimeout(function () {
        //        // Modify the currently displayed notification
        //        cordova.plugins.backgroundMode.configure({
        //            title: 'SRA',
        //            text: 'SRA - Running in background - 1 min.'
        //        });
        //        //Call the task to SRAUpdateTasks;
        //        alert('Ativei a paradinha!');
        //    }, 60000);
        //}
    };

    function onPause() {
        // TODO: This application has been suspended. Save application state here.
    };

    function onResume() {
        // TODO: This application has been reactivated. Restore application state here.
    };
})();

var stkApp = function () { }
stkApp.prototype = function () {

    var userHours = {};
    var erro = '';
    var _login = true, //false para ativar o login;

    run = function () {

        var that = this;
        $('#home').on('pagebeforecreate', $.proxy(_initHome, that));
        $('#aditionalPage').on('pageshow', $.proxy(_initaditionalPage, that));
        $('#approvePage').on('pageshow', $.proxy(_initapprovePage, that));
        $('#faultPage').on('pageshow', $.proxy(_initfaultPage, that));
        $('#settingPage').on('pageshow', $.proxy(_initsettingPage, that));
        $('#aditionalAddPage').on('pageshow', $.proxy(_initaditionalAddPage, that));
        $('#normalAddPage').on('pageshow', $.proxy(_initnormalAddPage, that));

        if (window.localStorage.getItem("userInfo") != null) {
            _login = true;
            //_loadHome(JSON.parse(window.localStorage.getItem("userInfo")));
            $.mobile.changePage('#home', { transition: 'flip' });
        }

        $('#btnLogoff').on('click', function () {
            $.mobile.changePage('#logon', { transition: 'flip' });
        });

        $('.loginBtn').on('click', function () {
            if (window.localStorage.getItem("userInfo") === null) {
                erro = '';
                if ($('#is_stk').val() == '')
                    erro += '- IS\n';
                if ($('#pass_stk').val() == '')
                    erro += '- Senha\n';

                if (erro.length > 0) {
                    alert('Erros encontrados: ' + erro);
                }
                else {

                    fauxAjax(function () {
                        var bodyxml = '  <soap:Body>';
                        bodyxml += '    <getColabInfo xmlns="http://tempuri.org/">';
                        bodyxml += '      <strFuncIS>MFCS</strFuncIS>';
                        bodyxml += '    </getColabInfo>';
                        bodyxml += '  </soap:Body>';
                        var envelope = getEnvelope(bodyxml);

                        $.ajax({
                            type: 'POST',
                            //url: 'http://intrasoft.softtek.com:8081/wsSRAPDK/cResourceHours.asmx/getColabInfo',
                            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getColabInfo',
                            contentType: 'text/xml; charset=utf-8',
                            data: envelope
                        })
                        .done(function (data) {
                            alert(data);
                            //var usrdata = { idUser: data.idUser, firstname: data.firstname, lastname: data.lastname, email: data.email, employer: data.employer };
                            //window.localStorage.setItem("userInfo", JSON.stringify(usrdata));
                            _loadHome(data);

                            $(this).hide();
                            _login = true;

                            $.mobile.changePage('#home', { transition: 'flip' });
                        })
                        .fail(function (jqXHR, textStatus, errorThrown) {
                            alert("Request failed: " + textStatus + "," + errorThrown);
                        });
                    }, 'autenticando...', this);
                }
            }

            return false;
        });

        if (!$.mobile.support.touch) {
            $("#listHours").removeClass("touch");
        }

        $("#listHours li").on("taphold", function (event) {
            //var listitem = $(this),
            //    dir = event.type === "swipeleft" ? "left" : "right",
            //    transition = $.support.cssTransform3d ? dir : false;
            if (confirm('Deseja Exluir o lançamento?')) {
                //  $("#listHours").listview("refresh");
                alert('hehe touch!');
            }
        });

        $('#btnLangBR, #btnLangES, #btnLangUS').on('click', function () {
            changeLang($(this).attr('id').substr(7, 2));
        });

        $('btnAddNormalHour').on('click', function () {
            var Dt = $('txtDt').val();
            var Hour = $('txtHour').val();
            var Proj = $('txtProj').val();
            var Activity = $('ddlActivity').val();
            var Desc = $('txtDesc').val();
            var DtRepBegin = $('txtDtRepNormalBegin').val();
            var DtRepEnd = $('txtDtRepNormalEnd').val();
        });

        $('btnAddAditionalHour').on('click', function () {
            var HourBegin = $('txtHourBegin').val();
            var Dt = $('txtDtAditional').val();
            var Hour = $('txtHourAditional').val();
            var Activity = $('ddlActivityAditional').val();
            var Desc = $('txtDescAditional').val();
            var DtRepBegin = $('txtDtRepAditionalBegin').val();
            var DtReplEnd = $('txtDtRepAditionalEnd').val();
        });

        $('btnSaveFaultHours').on('click', function () {
            var DtBegin = $('txtDtBeginFault').val();
            var DtEnd = $('txtDtEndFault').val();
            var Hour = $('txtHourFault').val();
            var Activity = $('ddlActivityFault').val();
            var Desc = $('txtDescFault').val();
        });

        //$('#fulldataBtn').click(function () {
        //    erro = '';
        //    if ($('#tfirstname').val() == '')
        //        erro += '- Primeiro Nome\n';
        //    if ($('#state option:selected').val() == '0')
        //        erro += '- Estado\n';

        //    if (erro.length > 0) {
        //        alert('Erros encontrados: ' + erro);
        //    }
        //    else {
        //        fauxAjax(function () {
        //            var iidUser = JSON.parse(window.localStorage.getItem("userInfo")).idUser;
        //            var dataUser = {
        //                idUser: iidUser,
        //                firstname: $('#tfirstname').val(),
        //                state: $('#state  option:selected').val(),
        //                customerSAP: ($('#customerSAP').is(":checked") ? "1" : "0")
        //            };

        //            window.localStorage.setItem("userInfo", JSON.stringify(dataUser));

        //            $.post("http://ec2-54-200-107-211.us-west-2.compute.amazonaws.com/odata/User", dataUser)
        //             .done(function (data) {
        //                 alert("Dados salvo com sucesso!");
        //                 _loadHome(data);
        //                 $.mobile.changePage('#home', { transition: 'flip' });
        //             })
        //            .fail(function (jqXHR, textStatus, errorThrown) {
        //                alert("Request failed: " + textStatus + "," + errorThrown);
        //            });
        //        }, 'gravando...', this);
        //    }
        //});
    },

    _initHome = function () {
        if (!_login) {
            $.mobile.changePage("#logon", { transition: "flip" });
        }
    },

    _loadHome = function (userInfo) {
        fauxAjax(function () {
            $.mobile.changePage('#home', { transition: 'flip' });
        }, 'carregando...', this);
    },

    _initaditionalAddPage = function () {
        $('#txtHourBegin,#txtDtAditional,#txtHourAditional,#ddlActivityAditional,#txtDescAditional,#txtDtRepAditionalBegin,#txtDtRepAditionalEnd').val('');
        fauxAjax(function () {
            $('#txtHourBegin').val('');
            $('#txtDtAditional').val('');
            $('#txtHourAditional').val('');
            $('#ddlActivityAditional').val('');
            $('#txtDescAditional').val('');
            $('#txtDtRepAditionalBegin').val('');
            $('#txtDtRepAditionalEnd').val('');
        }, 'carregando...', this);
    },

    _initnormalAddPage = function () {
        $('#txtDt,#txtHour,#txtProj,#ddlActivity,#txtDesc,#txtDtRepNormalBegin,#txtDtRepNormalEnd').val('');
        fauxAjax(function () {
            $('#txtDt').val('');
            $('#txtHour').val('');
            $('#txtProj').val('');
            $('#ddlActivity').val('');
            $('#txtDesc').val('');
            $('#txtDtRepNormalBegin').val('');
            $('#txtDtRepNormalEnd').val('');
        }, 'carregando...', this);
    },

    _initfaultPage = function () {
        $('#txtDtBeginFault,#txtDtEndFault,#txtHourFault,#ddlActivityFault,#txtDescFault').val('');
        fauxAjax(function () {
            $('#txtDtBeginFault').val('');
            $('#txtDtEndFault').val('');
            $('#txtHourFault').val('');
            $('#ddlActivityFault').val('');
            $('#txtDescFault').val('');
        }, 'carregando...', this);
    },

    _initaditionalPage = function () {

    },

    _initapprovePage = function () {

    },

    _initsettingPage = function () {

        //$('#tel').val('');
        //$('#detail').val('');

        //if (window.localStorage.getItem("agenda") === null)
        //    $.mobile.changePage('#agendaPage', { transition: 'flip' });
        //else {
        //    $.mobile.changePage('#home', { transition: 'flip' });
        //    alert('Obrigado por já ter marcado uma agenda!');
        //}
    },

    //_LoadLuluCombo = function () {
        //$('#question1,#question2,#question3,#question4,#question5').prop('checked', false).checkboxradio('refresh');
        //$('#standLuluCombo').empty();
        //$('#standLuluCombo').append("<option value='0' selected='selected'>Selecione...</option>");

        //var lululist = {
        //    "odata.metadata": "http://ec2-54-200-107-211.us-west-2.compute.amazonaws.com/odata/$metadata#Stand", "value": [
        //      {
        //          "idStand": 30, "dsStand": "Softtek"
        //      }, {
        //          "idStand": 31, "dsStand": "Uol Diveo"
        //      }, {
        //          "idStand": 32, "dsStand": "Sonda"
        //      }, {
        //          "idStand": 94, "dsStand": "GOL"
        //      }
        //    ]
        //};

        //for (var ln in lululist.value) {
        //    $('#standLuluCombo').append("<option value='" + lululist.value[ln].idStand + "'>" + lululist.value[ln].dsStand + "</option>");
        //}

        //$('#standLuluCombo').selectmenu('refresh', true);

        //fauxAjax(function () {
        //    $.getJSON("http://ec2-54-200-107-211.us-west-2.compute.amazonaws.com/odata/Stand")
        //    .done(function (data) {
        //        for (var ln in data.value) {
        //            $('#standLuluCombo').append("<option value='" + data.value[ln].idStand + "'>" + data.value[ln].dsStand + "</option>");
        //        }
        //    })
        //    .fail(function (jqxhr, textStatus, error) {
        //        alert("Request Failed: " + textStatus + ", " + error);
        //    });
        //}, 'carregando...', this);
    //},

    //_initlulurankPage = function () {
        //$('#myRankListView li').remove();

        //fauxAjax(function () {
        //    $.getJSON("http://ec2-54-200-107-211.us-west-2.compute.amazonaws.com/api/Lulu")
        //    .done(function (data) {
        //        var q = 1;
        //        for (var ln in data) {
        //            if (q == 1)
        //                $('#myRankListView').append("<li class='ui-li-has-thumb' id='" + data[ln].idStand + "'><a href='#' class='ui-btn ui-icon-carat-r'><img src='images/trofeu.png'><p>" + data[ln].dsStand + "</p></a></li>");
        //            else
        //                $('#myRankListView').append("<li class='ui-li-has-thumb' id='" + data[ln].idStand + "'><a href='#' class='ui-btn ui-icon-carat-r'><img src='images/trofeu2.png'><p>" + data[ln].dsStand + "</p></a></li>");
        //            q++;
        //        }
        //    })
        //    .fail(function (jqxhr, textStatus, error) {
        //        alert("Request Failed: " + textStatus + ", " + error);
        //    });
        //}, 'carregando...', this);
    //},

    //_savePoints = function _savePoints(actionType) {
        //if (actionType != '' && window.localStorage.getItem(actionType) === null) {
        //    var iidUser = JSON.parse(window.localStorage.getItem("userInfo")).idUser;
        //    var postdata = { idUser: iidUser, typeAction: actionType };
        //    $.post("http://ec2-54-200-107-211.us-west-2.compute.amazonaws.com/odata/Point", postdata)
        //    .done(function (data) {
        //        window.localStorage.setItem(actionType, "ok");
        //        alert("Pontuação salva!");
        //    })
        //    .fail(function (jqXHR, textStatus, errorThrown) {
        //        alert("Save Points error: " + textStatus + "," + errorThrown);
        //    });
        //}
    //},

    changeLang = function changeLang(lang) {
        $("span[id^='label']").each(function (i, el) {
            //console.log($(this).html());
        });
    },

    saveUserData = function saveUserData(data) {
        window.localStorage.setItem("userInfo", JSON.stringify(data));
    },

    getUserData = function getUserData() {
        return window.localStorage.getItem("userInfo");
    },

    saveLancamento = function saveLancamento(data) {
        window.localStorage.setItem("userLanc", JSON.stringify(data));
    },

    getEnvelope = function getEnvelope(xmlBody) {
        var dataXML = '<?xml version="1.0" encoding="utf-8"?>';
        dataXML += '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">';
        dataXML += '  <soap:Header>';
        dataXML += '    <ValidationSoapHeader xmlns="http://tempuri.org/">';
        dataXML += '      <_devToken>WSPDK11PDK11@@</_devToken>';
        dataXML += '    </ValidationSoapHeader>';
        dataXML += '  </soap:Header>';
        dataXML += xmlBody
        dataXML += '</soap:Envelope>';
        return dataxml;
    },

    GetListHoraRecursoNew = function GetListHoraRecursoNew(FuncIs, intAdditionalHour, strWeekDay, strStartDate, strEndDate) {
        var body = '<soap:Body>';
        body += '  <getListHoraRecursoNew>';
        //<!--Optional:-->'
        body += '<strFuncIs>' + FuncIs + '</strFuncIs>';
        body += '<intYear>' + 0 + '</intYear>';
        body += '<intMonth>' + 0 + '</intMonth>';
        body += '<intWeek>' + 0 + '</intWeek>';
        //<!--Optional:-->'
        body += '<strActivityCode>' + '' + '</strActivityCode>';
        //<!--Optional:-->'
        body += '<strSiriusCode>' + '0' + '</strSiriusCode>';
        body += '<intProjectCode>' + 0 + '</intProjectCode>';
        body += '<intAdditionalHour>' + intAdditionalHour + '</intAdditionalHour>';
        //<!--Optional:-->'
        body += '<strWeekDay>' + strWeekDay + '</strWeekDay>';
        //<!--Optional:-->'
        body += '<strCreatedBy>' + '' + '</strCreatedBy>';
        //<!--Optional:-->'
        body += '<strStartDate>' + strStartDate + '</strStartDate>';
        //<!--Optional:-->'
        body += '<strEndDate>' + strEndDate + '</strEndDate>';
        body += '</getListHoraRecursoNew>';
        body += "<soap:Body>";
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            //url: 'http://intrasoft.softtek.com:8081/wsSRAPDK/cResourceHours.asmx/getListHoraRecursoNew',
            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getListHoraRecursoNew',
            contentType: 'text/xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            returnData = data;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });

        return returnData;
    },

    getWeekByDay = function getWeekByDay(year, month, day) {
        var body = '<soap:Body>';
        body += '  <getWeekByDay>';
        body += '     <intYear>' + year + '</intYear>';
        body += '     <intMonth>' + month + '</intMonth>';
        body += '     <intDay>' + day + '</intDay>';
        body += '  </getWeekByDay>';
        body += "<soap:Body>";
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getWeekByDayResponse',
            contentType: 'text/xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            returnData = data;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });

        return returnData;
    },

    addRecordHoraRecurso = function addRecordHoraRecurso(intYear, strFuncIS, intWeek, intWeekDay,
    		intSequencial, strFinalCustomer, strActivityCode, intOpportunity, intDescHoursCode,
    		dblHours, intMonth, intMonthDay, strAlternativeCode, intCalendarYear, intAdditionalHour,
    		strCreatedBy, HourEnter, segmentId) {
        var body = '<soap:Body>';
        body += '<addRecordHoraRecursoMobile>';
        body += '<IntYear>' + intYear + '</IntYear>';
        //Optional
        body += '<strFuncIS>' + strFuncIS + '</strFuncIS>';
        body += '<intWeek>' + intWeek + '</intWeek>';
        body += '<intWeekDay>' + intWeekDay + '</intWeekDay>';
        body += '<intSequencial>' + intSequencial + '</intSequencial>';
        //Optional
        body += '<strFinalCustomer>' + strFinalCustomer + '</strFinalCustomer>';
        //Optional
        body += '<strActivityCode>' + strActivityCode.replace(' ', '').replace(' ', '').trim() + '</strActivityCode>';
        body += '<intOpportunity>' + intOpportunity + '</intOpportunity>';
        body += '<intDescHoursCode>' + intDescHoursCode + '</intDescHoursCode>';
        //Optional:-->'
        body += '<dblHours>' + dblHours + '</dblHours>';
        body += '<intMonth>' + intMonth + '</intMonth>';
        body += '<intMonthDay>' + intMonthDay + '</intMonthDay>';
        //<!--Optional:-->'
        body += '<strAlternativeCode>' + strAlternativeCode + '</strAlternativeCode>';
        body += '<intCalendarYear>' + intCalendarYear + '</intCalendarYear>';
        body += '<intAdditionalHour>' + intAdditionalHour + '</intAdditionalHour>';
        //<!--Optional:-->'
        body += '<strCreatedBy>' + strCreatedBy + '</strCreatedBy>';
        //<!--Optional:-->'
        body += '<HourEnter>' + HourEnter + '</HourEnter>';
        //<!--Optional:-->'
        body += '<segmentId>' + segmentId.trim() + '</segmentId>';
        body += '</addRecordHoraRecursoMobile>';
        body += '<soap:Body>';
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=addRecordHoraRecursoMobile',
            contentType: 'text/xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            returnData = data;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });

        return returnData;
    },

    getActivity = function getActivity() {
        var body = '<soap:Body>';
        body += '  <getActivity>';
        body += '     <strSegmentId>' + '' + '</strSegmentId>';
        body += '     <strActivityId>' + '' + '</strActivityId>';
        body += '     <intTypeOfActivity>' + '' + '</intTypeOfActivity>';
        body += '     <strEntityId>' + '' + '</strEntityId>';
        body += '     <strTeamId>' + '' + '</strTeamId>';
        body += '   </getActivity>';
        body += '<soap:Body>';
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getActivity',
            contentType: 'text/xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            returnData = data;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });

        return returnData;
    },

    getActivities = function getActivities() {
        var body = '<soap:Body>';
        body += '  <getActivities>';
        body += '     <strSegmentId>' + '' + '</strSegmentId>';
        body += '     <strEntityId>' + '' + '</strEntityId>';
        body += '     <strTeamId>' + '' + '</strTeamId>';
        body += '  </getActivities>';
        body += '<soap:Body>';
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getActivities',
            contentType: 'text/xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            returnData = data;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });

        return returnData;
    },

    getSequencial = function getSequencial(strFuncIS, intYear, intWeek, intWeekDay) {
        var body = '<soap:Body>';
        body += '  <getSequencial xmlns=\"http://tempuri.org/\">';
        body += '<strFuncIS>' + strFuncIS + '</strFuncIS>';
        body += '<intYear>' + intYear + '</intYear>';
        body += '<intWeek>' + intWeek + '</intWeek>';
        body += '<intWeekDay>' + intWeekDay + '</intWeekDay>';
        body += '</getSequencial>';
        body += '<soap:Body>';
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getSequencial',
            contentType: 'text/xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            returnData = data;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });

        return returnData;
    },

    getCombodataAbsence = function getCombodataAbsence(segmentId, isBillable) {
        var body = '<soap:Body>';
        body += '<getCombodataAbsence xmlns=\"http://tempuri.org/\">';
        body += '<segmentId>' + segmentId + '</segmentId>';
        body += '<isBillable>' + isBillable + '</isBillable>';
        body += '</getCombodataAbsence>';
        body += '<soap:Body>';
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getCombodataAbsence',
            contentType: 'text/xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            returnData = data;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });

        return returnData;
    },

    ObtainOpportunity = function ObtainOpportunity(Activity, IpID, FuncIS) {
        var body = '<soap:Body>';
        body += '<ObtainOpportunity xmlns=\"http://tempuri.org/\">';
        body += '<Activity>' + Activity + '</Activity>';
        body += '<IpID>' + IpID + '</IpID>';
        body += '<FuncIS>' + FuncIS + '</FuncIS>';
        body += '</ObtainOpportunity>';
        body += '<soap:Body>';
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=ObtainOpportunity',
            contentType: 'text/xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            returnData = data;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });

        return returnData;
    },

    GetActualWeek = function GetActualWeek() {
        var body = '<soap:Body>';
        body += '<GetActualWeek xmlns=\"http://tempuri.org/\" />';
        body += '<soap:Body>';
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=GetActualWeek',
            contentType: 'text/xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            returnData = data;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });

        return returnData;
    },

    getColabInfo = function getColabInfo(funcIS) {
        var body = '<soap:Body>';
        body += '<getColabInfo xmlns=\"http://tempuri.org/\">';
        body += '<strFuncIS>' + funcIS + '</strFuncIS>';
        body += '</getColabInfo>';
        body += '<soap:Body>';
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getColabInfo',
            contentType: 'text/xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            returnData = data;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });

        return returnData;
    },

    isLeader = function isLeader(funcIS) {
        var body = '<soap:Body>';
        body += '<isLeader xmlns="http://tempuri.org/">';
        body += '<strFuncIS>' + funcIS + '</strFuncIS>';
        body += '</isLeader>';
        body += '<soap:Body>';
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=isLeader',
            contentType: 'text/xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            returnData = data;
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });

        return returnData;
    },

    fauxAjax = function fauxAjax(func, text, thisObj) {
        $.mobile.loading('show', { theme: 'a', textVisible: true, text: text });
        window.setTimeout(function () {
            $.mobile.loading('hide');
            func();
        }, 2000);
    };

    return {
        run: run,
    };
}();