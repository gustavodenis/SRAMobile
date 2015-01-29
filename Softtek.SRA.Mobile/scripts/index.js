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
        // Enable background modeç
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

    var erro = '';
    var aLancamentos = [];
    var Weeks = [];
    var Activities = [];
    var IdSegment = 'BR';
    var FuncIS = '';
    var _login = true, //false para ativar o login;

    run = function () {

        var that = this;
        $('#home').on('pagebeforecreate', $.proxy(_initHome, that));
        $('#normalPage').on('pageshow', $.proxy(_initnormalPage, that));
        $('#aditionalPage').on('pageshow', $.proxy(_initaditionalPage, that));
        $('#approvePage').on('pageshow', $.proxy(_initapprovePage, that));
        $('#faultPage').on('pageshow', $.proxy(_initfaultPage, that));
        $('#settingPage').on('pageshow', $.proxy(_initsettingPage, that));
        $('#normalAddPage').on('pageshow', $.proxy(_initnormalAddPage, that));
        $('#aditionalAddPage').on('pageshow', $.proxy(_initaditionalAddPage, that));

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
                        bodyxml += '      <strFuncIS>ACFV</strFuncIS>';
                        //bodyxml += '      <strPass>stk1234!</strPass>';
                        bodyxml += '    </getColabInfo>';
                        bodyxml += '  </soap:Body>';
                        var envelope = getEnvelope(bodyxml);

                        $.ajax({
                            type: 'POST',
                            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getColabInfo',
                            contentType: 'text/xml; charset=utf-8',
                            data: envelope
                        })
                        .done(function (xml) {
                            var usrdata;
                            $(xml).find('Table').each(function () {
                                usrdata = {
                                    FuncIs: $(this).find('FuncIs').text(),
                                    Tipo: $(this).find('Tipo').text(),
                                    Nome: $(this).find('Nome').text(),
                                    Email: $(this).find('Email').text(),
                                    UserID: $(this).find('UserID').text(),
                                    Billable: $(this).find('Billable').text(),
                                    CodSegmento: $(this).find('CodigoSegmento').text()
                                };
                            });

                            window.localStorage.setItem("userInfo", JSON.stringify(usrdata));
                            _loadHome(usrdata);

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
            if (confirm('Deseja Exluir o lançamento?')) {
                fauxAjax(function () {
                    var bodyxml = '  <soap:Body>';
                    bodyxml += '      <deleteRecordByDay xmlns="http://tempuri.org/">';
                    bodyxml += '    <strFuncIS>' + FuncIS + '</strFuncIS>';
                    bodyxml += '    <intYear>int</intYear>';
                    bodyxml += '    <intMonth>int</intMonth>';
                    bodyxml += '    <intDay>int</intDay>';
                    bodyxml += '    <intAdditionalHour>0</intAdditionalHour>';
                    bodyxml += '    </deleteRecordByDay>';
                    bodyxml += '  </soap:Body>';
                    //**** Falta incluir o Sequencial.. para excluir somente o registro e não todo o dia.
                    var envelope = getEnvelope(bodyxml);

                    $.ajax({
                        type: 'POST',
                        url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=deleteRecordByDay',
                        contentType: 'text/xml; charset=utf-8',
                        data: envelope
                    })
                    .done(function (data) {
                        LoadNormalHours($('#ddlWeek').val());
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        alert("Request failed: " + textStatus + "," + errorThrown);
                    });
                }, 'excluindo...', this);
            }
        });

        $('#btnLangBR, #btnLangES, #btnLangUS').on('click', function () {
            changeLang($(this).attr('id').substr(7, 2));
        });

        $('btnAddNormalHour').on('click', function () {
            var Dt = $('txtDt').val();
            var Hour = $('txtHour').val();
            var Proj = $('txtProj').val();
            var Activity = $('ddlActivity  option:selected').val();
            var Desc = $('txtDesc').val();
            var DtRepBegin = $('txtDtRepNormalBegin').val();
            var DtRepEnd = $('txtDtRepNormalEnd').val();

            var body = '<soap:Body>';
            body += '<addRecordHoraRecursoMobile>';
            body += '<IntYear>' + intYear + '</IntYear>';
            body += '<strFuncIS>' + FuncIS + '</strFuncIS>';
            body += '<intWeek>' + intWeek + '</intWeek>';
            body += '<intWeekDay>' + intWeekDay + '</intWeekDay>';
            body += '<intSequencial>' + intSequencial + '</intSequencial>';
            body += '<strFinalCustomer>' + Desc + '</strFinalCustomer>';
            body += '<strActivityCode>' + Activity + '</strActivityCode>';
            body += '<intOpportunity>' + intOpportunity + '</intOpportunity>';
            body += '<intDescHoursCode>' + intDescHoursCode + '</intDescHoursCode>';
            body += '<dblHours>' + dblHours + '</dblHours>';
            body += '<intMonth>' + intMonth + '</intMonth>';
            body += '<intMonthDay>' + intMonthDay + '</intMonthDay>';
            body += '<strAlternativeCode>' + Proj + '</strAlternativeCode>';
            body += '<intCalendarYear>' + intCalendarYear + '</intCalendarYear>';
            body += '<intAdditionalHour>0</intAdditionalHour>';
            body += '<strCreatedBy>' + FuncIS + '</strCreatedBy>';
            body += '<HourEnter>' + Hour + '</HourEnter>';
            body += '<segmentId>' + IdSegment.trim() + '</segmentId>';
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

        $('#ddlWeek').on('click', function () {
            LoadNormalHours($(this).val());
        });

        $('#ddlWeekAditional').on('click', function () {
            //LoadAditionalHours($(this).val());
        });
    },

    _initHome = function () {
        if (!_login) {
            $.mobile.changePage("#logon", { transition: "flip" });
        }
    },

    _loadHome = function (userInfo) {
        var datauser = JSON.parse(userInfo);
        IdSegment = datauser.CodSegmento;
        FuncIS = datauser.FuncIs;
        fauxAjax(function () {
            $.mobile.changePage('#home', { transition: 'flip' });
        }, 'carregando...', this);
    },

    _initnormalPage = function () {
        if (Weeks.length == 0) {
            var body = '<soap:Body>';
            body += '  <getRangeSRADays>';
            body += '     <strSegmentId>' + IdSegment + '</strSegmentId>';
            body += '     <intMonth>-666</intWeek>'; // -666 traz todas disponíveis;
            body += '  </getRangeSRADays>';
            body += "<soap:Body>";
            var envelope = getEnvelope(body);
            $.ajax({
                type: 'POST',
                url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getRangeSRADays',
                contentType: 'text/xml; charset=utf-8',
                data: envelope
            })
            .done(function (xml) {
                $(xml).find('Table').each(function () {
                    Weeks.push({ 'WeekDate': $(this).find('WeekDate').text(), 'WeekString': $(this).find('WeekDate').text() + " - " + $(this).find('DateWeek').text() + " - " + $(this).find('DatePlan').text() });
                });

                MountWeekCombo();
                /*<DatePlan>2015-02-19T00:00:00-06:00</DatePlan>
                <YearMonth>2015</YearMonth>
                <MonthDate>2</MonthDate>
                <DayMonth>19</DayMonth>
                <YearWeek>2015</YearWeek>
                <WeekDate>7</WeekDate>
                <DayWeek>4</DayWeek>
                <DateWeek>2015-02-21T00:00:00-06:00</DateWeek>*/
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert("Request failed: " + textStatus + "," + errorThrown);
            });
        }
        else {
            MountWeekCombo();
        }
    },

    MountWeekCombo = function MountWeekCombo() {
        $('#ddlWeek, #ddlWeekAditional').empty();
        $('#ddlWeek, #ddlWeekAditional').append("<option value='0' selected='selected'>Selecione...</option>");
        $.each(Weeks, function (index, el) {
            $('#ddlWeek, #ddlWeekAditional').append("<option value=" + Weeks[index].WeekDate + ">" + Weeks[index].WeekString + "</option>");
        });
    },

    LoadNormalHours = function (Semana) {
        fauxAjax(function () {
            var body = '<soap:Body>';
            body += '  <getListHoraRecursoNew>';
            body += '<strFuncIs>' + FuncIs + '</strFuncIs>';
            body += '<intYear>' + 0 + '</intYear>';
            body += '<intMonth>' + 0 + '</intMonth>';
            body += '<intWeek>' + 0 + '</intWeek>';
            body += '<strActivityCode>' + '' + '</strActivityCode>';
            body += '<strSiriusCode>' + '0' + '</strSiriusCode>';
            body += '<intProjectCode>' + 0 + '</intProjectCode>';
            body += '<intAdditionalHour>' + intAdditionalHour + '</intAdditionalHour>';
            body += '<strWeekDay>' + strWeekDay + '</strWeekDay>';
            body += '<strCreatedBy>' + '' + '</strCreatedBy>';
            body += '<strStartDate>' + strStartDate + '</strStartDate>';
            body += '<strEndDate>' + strEndDate + '</strEndDate>';
            body += '</getListHoraRecursoNew>';
            body += "<soap:Body>";
            var envelope = getEnvelope(body);

            $.ajax({
                type: 'POST',
                //url: 'http://intrasoft.softtek.com:8081/wsSRAPDK/cResourceHours.asmx/getListHoraRecursoNew',
                url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getListHoraRecursoNew',
                contentType: 'text/xml; charset=utf-8',
                data: envelope
            })
            .done(function (xml) {
                var rows = '';
                $('#listHours').empty();
                //$('#listHours li').remove();
                $(xml).find('Table').each(function () {
                    aLancamentos.push({
                        'Ano': $(this).find('Ano').text(),
                        'Semana': $(this).find('Semana').text(),
                        'Sequencial': $(this).find('Sequencial').text(),
                        'CodigoAlternativo': $(this).find('CodigoAlternativo').text(),
                        'CodigoAtividade': $(this).find('CodigoAtividade').text(),
                        'Horas': $(this).find('Horas').text(),
                        'DiaMes': $(this).find('DiaMes').text(),
                        'DiaSemana': $(this).find('DiaSemana').text(),
                        'Mes': $(this).find('Mes').text(),
                        'AnoCalendario': $(this).find('AnoCalendario').text(),
                        'Descricao': $(this).find('Descricao').text()
                    });

                    rows += '<li>';
                    rows += '<a href="#"><h3>' + getDateString($(this).find('DiaMes').text(), $(this).find('Mes').text(), $(this).find('Ano').text()) + '</h3><p class="topic"><strong>';
                    rows += $(this).find('CodigoAlternativo').text() + '</strong> ' + $(this).find('Descricao').text() + '</p><p class="ui-li-aside"><strong>' + parseInt($(this).find('Horas').text()).toString() + ' Horas</strong></p></a>';
                    rows += '<a href="#" Seq=' + $(this).find('Sequencial').text() + ' class="btnEditHN"></a>'
                    rows += '</li>';

                    $('#listHours').append(rows);
                });

                $('.btnEditHN').on('click', function () {
                    LoadDataNormalHours($(this).attr('Seq'));
                });

                $("#listHours").listview("refresh");
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert("Request failed: " + textStatus + "," + errorThrown);
            });
        }, 'carregando...', this);
    },

    LoadDataNormalHours = function (Seq) {
        fauxAjax(function () {
            $.mobile.changePage('#normalAddPage', { transition: 'flip' });
            //$('#txtDt,#txtHour,#txtProj,#ddlActivity,#txtDesc,#txtDtRepNormalBegin,#txtDtRepNormalEnd').val('');

            $(aLancamentos).each(function () {
                if ($(this).Sequencial == Seq) {
                    $('#txtDt').val(getDateString($(this).DiaMes, $(this).Mes, $(this).Ano));
                    $('#txtHour').val($(this).Horas);
                    $('#txtProj').val($(this).CodigoAlternativo);
                    $('#ddlActivity').val($(this).CodigoAtividade);
                    $('#txtDesc').val($(this).Descricao);
                }
            });
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
            $('#txtDescFault').val('')
            ;
        }, 'carregando...', this);
    },

    _initaditionalPage = function () {

    },

    _initapprovePage = function () {

    },

    _initsettingPage = function () {

    },

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

    getRangeSRADays = function getRangeSRADays(intWeek) {
        var body = '<soap:Body>';
        body += '  <getRangeSRADays>';
        body += '     <strSegmentId>' + IdSegment + '</strSegmentId>';
        body += '     <intMonth>' + intWeek + '</intWeek>'; // -666 traz todas disponíveis;
        body += '  </getRangeSRADays>';
        body += "<soap:Body>";
        var envelope = getEnvelope(body);
        var returnData = [];

        $.ajax({
            type: 'POST',
            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getRangeSRADays',
            contentType: 'text/xml; charset=utf-8',
            data: envelope
        })
        .done(function (xml) {
            $(xml).find('Table').each(function () {
                returnData.push({ 'ord': $(this).find('ord').text(), 'value': $(this).find('value').text(), 'descr': $(this).find('descr').text() });
            });
            /*<DatePlan>2015-02-19T00:00:00-06:00</DatePlan>
            <YearMonth>2015</YearMonth>
            <MonthDate>2</MonthDate>
            <DayMonth>19</DayMonth>
            <YearWeek>2015</YearWeek>
            <WeekDate>7</WeekDate>
            <DayWeek>4</DayWeek>
            <DateWeek>2015-02-21T00:00:00-06:00</DateWeek>*/
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
        if (Activities.length == 0) {
            var body = '<soap:Body>';
            body += '<getCombodataAbsence xmlns=\"http://tempuri.org/\">';
            body += '<segmentId>' + segmentId + '</segmentId>';
            body += '<isBillable>' + isBillable + '</isBillable>';
            body += '</getCombodataAbsence>';
            body += '<soap:Body>';
            var envelope = getEnvelope(body);

            $.ajax({
                type: 'POST',
                url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getCombodataAbsence',
                contentType: 'text/xml; charset=utf-8',
                data: envelope
            })
            .done(function (xml) {
                $(xml).find('Table').each(function () {
                    Activities.push({ 'ord': $(this).find('ord').text(), 'value': $(this).find('value').text(), 'descr': $(this).find('descr').text() });
                });
                MountActivityCombo();
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert("Request failed: " + textStatus + "," + errorThrown);
            });
        }
        else {
            MountActivityCombo();
        }
    },

    MountActivityCombo = function MountActivityCombo() {
        $('#ddlActivity, #ddlActivityAditional').empty();
        $('#ddlActivity, #ddlActivityAditional').append("<option value='0' selected='selected'>Selecione...</option>");
        $.each(Activities, function (index, el) {
            $('#ddlActivity, #ddlActivityAditional').append("<option value=" + Activities[index].ord + ">" + Activities[index].value + "</option>");
        });
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

function getDateString(dia, mes, ano) {
    return zeroPad(dia, 1) + "/" + zeroPad(mes, 1) + "/" + ano;
}

function zeroPad(num, numZeros) {
    var n = Math.abs(num);
    var zeros = Math.max(0, numZeros - Math.floor(n).toString().length);
    var zeroString = Math.pow(10, zeros).toString().substr(1);
    if (num < 0) {
        zeroString = '-' + zeroString;
    }

    return zeroString + n;
}

function comparaData(dt_ini, dt_fim) {
    var dtIni = dt_ini.split("/");
    var dtFim = dt_fim.split("/");

    var dataInicio = parseInt(dtIni[2] + dtIni[1] + dtIni[0]);
    var dataFinal = parseInt(dtFim[2] + dtFim[1] + dtFim[0]);
    if (dataFinal < dataInicio) {
        return false;
    } else {
        return true;
    }
}