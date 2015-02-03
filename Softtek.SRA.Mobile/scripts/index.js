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
    var aLancamentosAditional = [];
    var Weeks = [];
    var Activities = [];
    var IdSegment = 'BR';
    var FuncIS = 'ACFV';
    var _login = true, //false para ativar o login;

    run = function () {

        var that = this;
        $('#home').on('pagebeforecreate', $.proxy(_initHome, that));
        $('#home').on('pageshow', $.proxy(_initLoadHome, that));
        $('#normalPage').on('pageshow', $.proxy(_initnormalPage, that));
        $('#aditionalPage').on('pageshow', $.proxy(_initaditionalPage, that));
        $('#approvePage').on('pageshow', $.proxy(_initapprovePage, that));
        $('#faultPage').on('pageshow', $.proxy(_initfaultPage, that));
        $('#settingPage').on('pageshow', $.proxy(_initsettingPage, that));
        $('#normalAddPage').on('pageshow', $.proxy(_initnormalAddPage, that));
        $('#aditionalAddPage').on('pageshow', $.proxy(_initaditionalAddPage, that));

        if (window.localStorage.getItem("userInfo") != null) {
            _login = true;
            _loadHome(window.localStorage.getItem("userInfo"));
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
                        bodyxml += '    <getAuthColabInfo xmlns="http://tempuri.org/">';
                        bodyxml += '      <strFuncIS>GUDE</strFuncIS>';
                        bodyxml += '      <strPass>d#nis1309</strPass>';
                        bodyxml += '    </getAuthColabInfo>';
                        bodyxml += '  </soap:Body>';
                        var envelope = getEnvelope(bodyxml);

                        $.ajax({
                            type: 'POST',
                            url: MountURLWS('getAuthColabInfo'),
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
            $("#listHours, #listAditionalHours").removeClass("touch");
        }

        $("#listAditionalHours li").on("taphold", function (event) {
            if (confirm('Deseja Exluir o lançamento?')) {
                fauxAjax(function () {
                    var ano, mes, dia;
                    var seq = $(this).attr('Seq');
                    $.each(aLancamentos, function (index, el) {
                        console.log(aLancamentos[index].Sequencial);
                        if (seq == aLancamentos[index].Sequencial) {
                            ano = aLancamentos[index].Ano;
                            mes = aLancamentos[index].Mes;
                            dia = aLancamentos[index].DiaMes;
                        }
                    });

                    var bodyxml = '<soap12:Body>';
                    bodyxml += '<deleteRecordByDayMobile xmlns="http://tempuri.org/">';
                    bodyxml += '<strFuncIS>' + FuncIS + '</strFuncIS>';
                    bodyxml += '<intYear>' + ano + '</intYear>';
                    bodyxml += '<intMonth>' + mes + '</intMonth>';
                    bodyxml += '<intDay>' + dia + '</intDay>';
                    bodyxml += '<intAdditionalHour>1</intAdditionalHour>';
                    bodyxml += '<intSequencial>' + seq + '</intSequencial>';
                    bodyxml += '</deleteRecordByDayMobile>';
                    bodyxml += '</soap12:Body>';
                    var envelope = getEnvelope(bodyxml);

                    $.ajax({
                        type: 'POST',
                        url: MountURLWS('deleteRecordByDayMobile'),
                        contentType: 'application/soap+xml; charset=utf-8',
                        data: envelope
                    })
                    .done(function (data) {
                        LoadAditionalHours($('#ddlWeek option:selected').val());
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        alert("Request failed: " + textStatus + "," + errorThrown);
                    });
                }, 'excluindo...', this);
            }
        });

        $("#listHours li").on("taphold", function (event) {
            if (confirm('Deseja Exluir o lançamento?')) {
                fauxAjax(function () {
                    var ano, mes, dia;
                    var seq = $(this).attr('Seq');
                    $.each(aLancamentos, function (index, el) {
                        console.log(aLancamentos[index].Sequencial);
                        if (seq == aLancamentos[index].Sequencial) {
                            ano = aLancamentos[index].Ano;
                            mes = aLancamentos[index].Mes;
                            dia = aLancamentos[index].DiaMes;
                        }
                    });

                    var bodyxml = '<soap12:Body>';
                    bodyxml += '<deleteRecordByDayMobile xmlns="http://tempuri.org/">';
                    bodyxml += '<strFuncIS>' + FuncIS + '</strFuncIS>';
                    bodyxml += '<intYear>' + ano + '</intYear>';
                    bodyxml += '<intMonth>' + mes + '</intMonth>';
                    bodyxml += '<intDay>' + dia + '</intDay>';
                    bodyxml += '<intAdditionalHour>0</intAdditionalHour>';
                    bodyxml += '<intSequencial>' + seq + '</intSequencial>';
                    bodyxml += '</deleteRecordByDayMobile>';
                    bodyxml += '</soap12:Body>';
                    var envelope = getEnvelope(bodyxml);

                    $.ajax({
                        type: 'POST',
                        url: MountURLWS('deleteRecordByDayMobile'),
                        contentType: 'application/soap+xml; charset=utf-8',
                        data: envelope
                    })
                    .done(function (data) {
                        LoadNormalHours($('#ddlWeek option:selected').val());
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

        $('#btnAddNormalHour').on('click', function () {
            var Dt = $('#txtDt').val();
            var Hour = $('#txtHour').val();
            var Proj = $('#txtProj').val();
            var Activity = $('#ddlActivity  option:selected').val();
            var Desc = $('#txtDesc').val();
            var DtRepBegin = $('#txtDtRepNormalBegin').val();
            var DtRepEnd = $('#txtDtRepNormalEnd').val();
            var Week = $('#ddlWeek option:selected').val();
            var dtParse = new Date(dt);

            var erros = '';
            if (Dt == '')
                erros += '- Data sem seleção\n';
            if (Hour == '')
                erros += '- Horas sem preenchimento\n';
            if (Proj == '')
                erros += '- Projeto sem preenchimento\n';
            if (Activity == '')
                erros += '- Atividade sem seleção\n';
            if (Desc == '')
                erros += '- Descrição sem preenchimento\n';
            if (erros.length > 0)
                alert('Erros Encontrados:\n' + erros);
            else {
                var body = '<soap12:Body>';
                body += '<addRecordHoraRecursoMobile xmlns="http://tempuri.org/">';
                body += '<IntYear>' + dtParse.getFullYear() + '</IntYear>';
                body += '<strFuncIS>' + FuncIS + '</strFuncIS>';
                body += '<intWeek>' + Week + '</intWeek>';
                body += '<intWeekDay>' + GetWeekDay(dtParse.getDay()) + '</intWeekDay>';
                body += '<intSequencial>' + $('#idSeq').val() + '</intSequencial>';
                body += '<strDescription>' + Desc + '</strDescription>';
                body += '<strActivityCode>' + Activity + '</strActivityCode>';
                body += '<intOpportunity>0</intOpportunity>';
                body += '<intDescHoursCode>' + intDescHoursCode + '</intDescHoursCode>';
                body += '<dblHours>' + Hour + '</dblHours>';
                body += '<intMonth>' + (dtParse.getMonth() + 1) + '</intMonth>';
                body += '<intMonthDay>' + (dtParse.getMonth() + 1) + '</intMonthDay>';
                body += '<strAlternativeCode>' + Proj + '</strAlternativeCode>';
                body += '<intCalendarYear>' + dtParse.getFullYear() + '</intCalendarYear>';
                body += '<intAdditionalHour>0</intAdditionalHour>';
                body += '<strCreatedBy>' + FuncIS + '</strCreatedBy>';
                body += '<HourEnter></HourEnter>';
                body += '<segmentId>' + IdSegment.trim() + '</segmentId>';
                body += '</addRecordHoraRecursoMobile>';
                body += '<soap12:Body>';
                var envelope = getEnvelope(body);
                var returnData;

                $.ajax({
                    type: 'POST',
                    url: MountURLWS('addRecordHoraRecursoMobile'),
                    contentType: 'application/soap+xml; charset=utf-8',
                    data: envelope
                })
                .done(function (data) {
                    alert((data == 'Sucesso' ? 'Registro salvo com sucesso!' : data));
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert("Request failed: " + textStatus + "," + errorThrown);
                });
            }
        });

        $('btnAddAditionalHour').on('click', function () {
            var HourBegin = $('#txtHourBegin').val();
            var Dt = $('#txtDtAditional').val();
            var Hour = $('#txtHourAditional').val();
            var Activity = $('#ddlActivityAditional option:selected').val();
            var Desc = $('#txtDescAditional').val();
            var DtRepBegin = $('#txtDtRepAditionalBegin').val();
            var DtReplEnd = $('#txtDtRepAditionalEnd').val();
            var Proj = $('#txtProjAditional').val();
            var Week = $('#ddlWeek option:selected').val();
            var dtParse = new Date(dt);

            var erros = '';
            if (Dt == '')
                erros += '- Data sem seleção\n';
            if (HourBegin == '')
                erros += '- Horas de Entrada sem preenchimento\n';
            if (Hour == '')
                erros += '- Horas sem preenchimento\n';
            if (Proj == '')
                erros += '- Projeto sem preenchimento\n';
            if (Activity == '')
                erros += '- Atividade sem seleção\n';
            if (Desc == '')
                erros += '- Descrição sem preenchimento\n';
            if (erros.length > 0)
                alert('Erros Encontrados:\n' + erros);
            else {
                var body = '<soap12:Body>';
                body += '<addRecordHoraRecursoMobile xmlns="http://tempuri.org/">';
                body += '<IntYear>' + dtParse.getFullYear() + '</IntYear>';
                body += '<strFuncIS>' + FuncIS + '</strFuncIS>';
                body += '<intWeek>' + Week + '</intWeek>';
                body += '<intWeekDay>' + GetWeekDay(dtParse.getDay()) + '</intWeekDay>';
                body += '<intSequencial>' + $('#idSeq').val() + '</intSequencial>';
                body += '<strDescription>' + Desc + '</strDescription>';
                body += '<strActivityCode>' + Activity + '</strActivityCode>';
                body += '<intOpportunity>0</intOpportunity>';
                body += '<intDescHoursCode>' + intDescHoursCode + '</intDescHoursCode>';
                body += '<dblHours>' + Hour + '</dblHours>';
                body += '<intMonth>' + (dtParse.getMonth() + 1) + '</intMonth>';
                body += '<intMonthDay>' + (dtParse.getMonth() + 1) + '</intMonthDay>';
                body += '<strAlternativeCode>' + Proj + '</strAlternativeCode>';
                body += '<intCalendarYear>' + dtParse.getFullYear() + '</intCalendarYear>';
                body += '<intAdditionalHour>1</intAdditionalHour>';
                body += '<strCreatedBy>' + FuncIS + '</strCreatedBy>';
                body += '<HourEnter>' + HourBegin + '</HourEnter>';
                body += '<segmentId>' + IdSegment.trim() + '</segmentId>';
                body += '</addRecordHoraRecursoMobile>';
                body += '<soap12:Body>';
                var envelope = getEnvelope(body);
                var returnData;

                $.ajax({
                    type: 'POST',
                    url: MountURLWS('addRecordHoraRecursoMobile'),
                    contentType: 'application/soap+xml; charset=utf-8',
                    data: envelope
                })
                .done(function (data) {
                    alert((data == 'Sucesso' ? 'Registro salvo com sucesso!' : data));
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert("Request failed: " + textStatus + "," + errorThrown);
                });
            }
        });

        $('btnSaveFaultHours').on('click', function () {
            var DtBegin = $('#txtDtBeginFault').val();
            var DtEnd = $('#txtDtEndFault').val();
            var Hour = $('#txtHourFault').val();
            var Activity = $('#ddlActivityFault option:selected').val();
            var Desc = $('#txtDescFault').val();
        });

        $('#ddlWeek').on('click', function () {
            LoadNormalHours($(this).val());
        });

        $('#ddlWeekAditional').on('click', function () {
            LoadAditionalHours($(this).val());
        });

        $('#btnAddHours').on('click', function () {
            $('#txtDt,#txtHour,#txtProj,#txtDesc,#txtDtRepNormalBegin,#txtDtRepNormalEnd').val('');
            $('#ddlActivity, #idSeq').val(0);
        });

        $('#btnAddAditionalHours').on('click', function () {
            $('#txtHourBegin,#txtDtAditional,#txtHourAditional,#txtDescAditional,#txtDtRepAditionalBegin,#txtDtRepAditionalEnd').val('');
            $('#ddlActivityAditional, #idSeqAditional').val(0);
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

        $('#ISFunc').val(datauser.FuncIs);
        $('#ISName').val(datauser.Nome);

        fauxAjax(function () {
            $.mobile.changePage('#home', { transition: 'flip' });
        }, 'carregando...', this);
    },

    _initLoadHome = function () {
        if (Weeks.length == 0) {
            var body = '<soap12:Body>';
            body += '<getRangeSRADaysMobile xmlns="http://tempuri.org/">';
            body += '<strSegmentId>' + IdSegment + '</strSegmentId>';
            body += '<intWeek>-666</intWeek>'; // -666 traz todas disponíveis;
            body += '</getRangeSRADaysMobile>';
            body += "</soap12:Body>";
            var envelope = getEnvelope(body);
            $.ajax({
                type: 'POST',
                url: MountURLWS('getRangeSRADaysMobile'),
                contentType: 'application/soap+xml; charset=utf-8',
                data: envelope
            })
            .done(function (xml) {
                $(xml).find('Table1').each(function () {
                    Weeks.push({ 'WeekNumber': $(this).find('WeekNumber').text(), 'DateStartWeek': $(this).find('DateStartWeek').text(), 'DateFinishWeek': $(this).find('DateFinishWeek').text() });
                });

                MountWeekCombo();
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert("Request failed: " + textStatus + "," + errorThrown);
            });
        }
        else {
            MountWeekCombo();
        }

        if (Activities.length == 0) {
            var body = '<soap12:Body>';
            body += '<getCombodataAbsence xmlns="http://tempuri.org/">';
            body += '<segmentId>' + IdSegment + '</segmentId>';
            body += '<isBillable>1</isBillable>';
            body += '</getCombodataAbsence>';
            body += '</soap12:Body>';
            var envelope = getEnvelope(body);

            $.ajax({
                type: 'POST',
                url: MountURLWS('getCombodataAbsence'),
                contentType: 'application/soap+xml; charset=utf-8',
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

    MountWeekCombo = function MountWeekCombo() {
        $('#ddlWeek, #ddlWeekAditional').empty();
        $('#ddlWeek, #ddlWeekAditional').append("<option value='0' selected='selected'>Selecione...</option>");
        $.each(Weeks, function (index, el) {
            $('#ddlWeek, #ddlWeekAditional').append("<option value=" + Weeks[index].WeekNumber + ">" + Weeks[index].WeekNumber + ' - ' + Weeks[index].DateStartWeek + ' - ' + Weeks[index].DateFinishWeek + "</option>");
        });
    },

    MountActivityCombo = function MountActivityCombo() {
        $('#ddlActivity, #ddlActivityAditional').empty();
        $('#ddlActivity, #ddlActivityAditional').append("<option value='0' selected='selected'>Selecione...</option>");
        $.each(Activities, function (index, el) {
            $('#ddlActivity, #ddlActivityAditional').append("<option value=" + Activities[index].value + ">" + Activities[index].value + "</option>");
        });
    },

    _initnormalPage = function () {
    },

    LoadNormalHours = function (Semana) {
        if (Semana > 0) {
            fauxAjax(function () {
                var body = '<soap12:Body>';
                body += '<getListHoraRecursoMobile  xmlns="http://tempuri.org/">';
                body += '<strFuncIs>' + FuncIS + '</strFuncIs>';
                body += '<intYear>' + $('#ddlWeek option:selected').text().substr($('#ddlWeek option:selected').text().length - 4, 4) + '</intYear>';
                body += '<intWeek>' + Semana + '</intWeek>';
                body += '<intAdditionalHour>0</intAdditionalHour>';
                body += '</getListHoraRecursoMobile>';
                body += "</soap12:Body>";
                var envelope = getEnvelope(body);

                $.ajax({
                    type: 'POST',
                    url: MountURLWS('getListHoraRecursoMobile'),
                    contentType: 'application/soap+xml; charset=utf-8',
                    data: envelope
                })
                .done(function (xml) {
                    var rows = '';
                    var total = 0;
                    aLancamentos = [];

                    $('#listHours').empty();

                    $(xml).find('Table').each(function () {
                        aLancamentos.push({
                            'Ano': $(this).find('Ano').text().trim(),
                            'Semana': $(this).find('Semana').text().trim(),
                            'Sequencial': $(this).find('Sequencial').text().trim(),
                            'CodigoAlternativo': $(this).find('CodigoAlternativo').text().trim(),
                            'CodigoAtividade': $(this).find('CodigoAtividade').text().trim(),
                            'Horas': $(this).find('Horas').text().trim(),
                            'DiaMes': $(this).find('DiaMes').text().trim(),
                            'DiaSemana': $(this).find('DiaSemana').text().trim(),
                            'Mes': $(this).find('Mes').text().trim(),
                            'AnoCalendario': $(this).find('AnoCalendario').text().trim(),
                            'Descricao': $(this).find('Descricao').text().trim()
                        });

                        rows += '<li Seq=' + $(this).find('Sequencial').text().trim() + '>';
                        rows += '<a href="#"><h3>' + getDateString($(this).find('DiaMes').text().trim(), $(this).find('Mes').text().trim(), $(this).find('Ano').text().trim()) + '</h3><p class="topic"><strong>';
                        rows += $(this).find('CodigoAlternativo').text().trim() + '</strong> ' + $(this).find('Descricao').text().trim() + '</p><p class="ui-li-aside"><strong>' + parseInt($(this).find('Horas').text()).toString() + ' Horas</strong></p></a>';
                        rows += '<a href="#" Seq=' + $(this).find('Sequencial').text().trim() + ' class="btnEditHN"></a>';
                        rows += '</li>';

                        total += parseFloat($(this).find('Horas').text().replace(':', '.'));
                    });

                    rows += '<li><a href="#"><h3>Total</h3><p class="ui-li-aside"><strong>' + total.toString() + ' Horas</strong></p></a></li>'
                    $('#listHours').append(rows);
                    $("#listHours").listview("refresh");

                    $('.btnEditHN').on('click', function () {
                        LoadDataNormalHours($(this).attr('Seq'));
                    });
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert("Request failed: " + textStatus + "," + errorThrown);
                });
            }, 'carregando...', this);
        }
        else {
            $('#listHours').empty();
        }
    },

    LoadDataNormalHours = function (Seq) {
        fauxAjax(function () {
            $('#divRepLanc').hide();
            $('#txtDt,#txtHour,#txtProj,#txtDesc,#txtDtRepNormalBegin,#txtDtRepNormalEnd').val('');
            $('#ddlActivity, #idSeq').val(0);

            $.each(aLancamentos, function (index, el) {
                if (aLancamentos[index].Sequencial == Seq) {
                    $('#idSeq').val(Seq);
                    $('#txtDt').val(getDateString(aLancamentos[index].DiaMes, aLancamentos[index].Mes, aLancamentos[index].Ano));
                    $('#txtHour').val(aLancamentos[index].Horas);
                    $('#txtProj').val(aLancamentos[index].CodigoAlternativo);
                    $('#ddlActivity').val(aLancamentos[index].CodigoAtividade);
                    $('#txtDesc').val(aLancamentos[index].Descricao);
                }
            });

            $.mobile.changePage('#normalAddPage', { transition: 'flip' });

        }, 'carregando...', this);
    },

    LoadAditionalHours = function (Semana) {
        if (Semana > 0) {
            fauxAjax(function () {
                var body = '<soap12:Body>';
                body += '<getListHoraRecursoMobile  xmlns="http://tempuri.org/">';
                body += '<strFuncIs>' + FuncIS + '</strFuncIs>';
                body += '<intYear>' + $('#ddlWeekAditional option:selected').text().substr($('#ddlWeekAditional option:selected').text().length - 4, 4) + '</intYear>';
                body += '<intWeek>' + Semana + '</intWeek>';
                body += '<intAdditionalHour>1</intAdditionalHour>';
                body += '</getListHoraRecursoMobile>';
                body += "</soap12:Body>";
                var envelope = getEnvelope(body);

                $.ajax({
                    type: 'POST',
                    url: MountURLWS('getListHoraRecursoMobile'),
                    contentType: 'application/soap+xml; charset=utf-8',
                    data: envelope
                })
                .done(function (xml) {
                    var rows = '';
                    var total = 0;
                    aLancamentosAditional = [];

                    $('#listAditionalHours').empty();

                    $(xml).find('Table').each(function () {
                        aLancamentosAditional.push({
                            'Ano': $(this).find('Ano').text().trim(),
                            'Semana': $(this).find('Semana').text().trim(),
                            'Sequencial': $(this).find('Sequencial').text().trim(),
                            'CodigoAlternativo': $(this).find('CodigoAlternativo').text().trim(),
                            'CodigoAtividade': $(this).find('CodigoAtividade').text().trim(),
                            'Horas': $(this).find('Horas').text().trim(),
                            'DiaMes': $(this).find('DiaMes').text().trim(),
                            'DiaSemana': $(this).find('DiaSemana').text().trim(),
                            'Mes': $(this).find('Mes').text().trim(),
                            'AnoCalendario': $(this).find('AnoCalendario').text().trim(),
                            'Entrada': $(this).find('Entrada').text().trim(),
                            'Descricao': $(this).find('Descricao').text().trim()
                        });

                        rows += '<li Seq=' + $(this).find('Sequencial').text().trim() + '>';
                        rows += '<a href="#"><h3>' + getDateString($(this).find('DiaMes').text().trim(), $(this).find('Mes').text().trim(), $(this).find('Ano').text().trim()) + '</h3><p class="topic"><strong>';
                        rows += $(this).find('CodigoAlternativo').text().trim() + '</strong> ' + $(this).find('Descricao').text().trim() + '</p><p class="ui-li-aside"><strong>' + parseInt($(this).find('Horas').text()).toString() + ' Horas</strong></p></a>';
                        rows += '<a href="#" Seq=' + $(this).find('Sequencial').text().trim() + ' class="btnEditHA"></a>';
                        rows += '</li>';

                        total += parseFloat($(this).find('Horas').text().replace(':', '.'));
                    });

                    rows += '<li><a href="#"><h3>Total</h3><p class="ui-li-aside"><strong>' + total.toString() + ' Horas</strong></p></a></li>'
                    $('#listAditionalHours').append(rows);
                    $("#listAditionalHours").listview("refresh");

                    $('.btnEditHA').on('click', function () {
                        LoadDataAditionalHours($(this).attr('Seq'));
                    });
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert("Request failed: " + textStatus + "," + errorThrown);
                });
            }, 'carregando...', this);
        }
        else {
            $('#listAditionalHours').empty();
        }
    },

    LoadDataAditionalHours = function (Seq) {
        fauxAjax(function () {
            $('#divRepLancAditional').hide();
            $('#txtHourBegin,#txtDtAditional,#txtHourAditional,#txtDescAditional,#txtDtRepAditionalBegin,#txtDtRepAditionalEnd').val('');
            $('#ddlActivityAditional, #idSeqAditional').val(0);

            $.each(aLancamentosAditional, function (index, el) {
                if (aLancamentosAditional[index].Sequencial == Seq) {
                    $('#idSeq').val(Seq);
                    $('#txtDtAditional').val(getDateString(aLancamentosAditional[index].DiaMes, aLancamentosAditional[index].Mes, aLancamentosAditional[index].Ano));
                    $('#txtHourAditional').val(aLancamentosAditional[index].Horas);
                    $('#txtProjAditional').val(aLancamentosAditional[index].CodigoAlternativo);
                    $('#ddlActivityAditional').val(aLancamentosAditional[index].CodigoAtividade);
                    $('#txtDescAditional').val(aLancamentosAditional[index].Descricao);
                    $('#txtHourBegin').val(aLancamentosAditional[index].Entrada);
                }
            });

            $.mobile.changePage('#aditionalAddPage', { transition: 'flip' });

        }, 'carregando...', this);
    },

    _initaditionalAddPage = function () {
    },

    _initnormalAddPage = function () {
    },

    _initfaultPage = function () {
        //$('#txtDtBeginFault,#txtDtEndFault,#txtHourFault,#ddlActivityFault,#txtDescFault').val('');
        //fauxAjax(function () {
        //    $('#txtDtBeginFault').val('');
        //    $('#txtDtEndFault').val('');
        //    $('#txtHourFault').val('');
        //    $('#ddlActivityFault').val('');
        //    $('#txtDescFault').val('')
        //    ;
        //}, 'carregando...', this);
    },

    _initaditionalPage = function () {
    },

    _initapprovePage = function () {

    },

    _initsettingPage = function () {

    },

    changeLang = function changeLang(langSel) {

        if (lang == "PT") {
            $(dictionarySTK.lang.PT).each(function (i, item) {
                changeLangObj(item.Controle, item.Label);
            });
        }
        else if (lang == "EN") {
            $(dictionarySTK.lang.EN).each(function (i, item) {
                changeLangObj(item.Controle, item.Label);
            });
        }
        else if (lang == "ES") {
            $(dictionarySTK.lang.ES).each(function (i, item) {
                changeLangObj(item.Controle, item.Label);
            });
        }
    },

    changeLangObj = function changeLangObj(obj, label) {
        var objLabel = $('#' + obj);
        var tag = $(objLabel).get(0).tagName;
        switch (tag) {
            case "span":
                $(objLabel).html(label);
                break;
            case "input":
                $(objLabel).val(label);
                break;
            default:
                $(objLabel).val(label);
                break;
        }
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
        dataXML += '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">';
        dataXML += '<soap12:Header>';
        dataXML += '<ValidationSoapHeader xmlns="http://tempuri.org/">';
        dataXML += '<_devToken>WSPDK11PDK11@@</_devToken>';
        dataXML += '</ValidationSoapHeader>';
        dataXML += '</soap12:Header>';
        dataXML += xmlBody;
        dataXML += '</soap12:Envelope>';
        return dataXML;
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
            url: MountURLWS('getWeekByDayResponse'),
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
            url: MountURLWS('addRecordHoraRecursoMobile'),
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
            url: MountURLWS('getActivity'),
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
            url: MountURLWS('getActivities'),
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
            url: MountURLWS('getSequencial'),
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
            url: MountURLWS('ObtainOpportunity'),
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
            url: MountURLWS('GetActualWeek'),
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
            url: MountURLWS('isLeader'),
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
    return zeroPad(dia, 2) + "/" + zeroPad(mes, 2) + "/" + ano;
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

function compareDate(dt_ini, dt_fim) {
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

Date.prototype.getWeek = function () {
    var onejan = new Date(this.getFullYear(), 0, 1);
    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
}

function getFirstDateOfWeek(weekNo) {
    var d1 = new Date();
    numOfdaysPastSinceLastMonday = eval(d1.getDay() - 1);
    d1.setDate(d1.getDate() - numOfdaysPastSinceLastMonday);
    var weekNoToday = d1.getWeek();
    var weeksInTheFuture = eval(weekNo - weekNoToday);
    d1.setDate(d1.getDate() + eval(7 * weeksInTheFuture));
    var rangeIsFrom = eval(d1.getDate() + "/" + d1.getMonth() + 1) + "/" + d1.getFullYear();
    return rangeIsFrom;
};

function getLastDateOfWeek(weekNo) {
    var d1 = new Date();
    numOfdaysPastSinceLastMonday = eval(d1.getDay() - 1);
    d1.setDate(d1.getDate() - numOfdaysPastSinceLastMonday);
    var weekNoToday = d1.getWeek();
    var weeksInTheFuture = eval(weekNo - weekNoToday);
    d1.setDate(d1.getDate() + eval(7 * weeksInTheFuture));
    var rangeIsFrom = eval(d1.getDate() + "/" + d1.getMonth() + 1) + "/" + d1.getFullYear();
    d1.setDate(d1.getDate() + 6);
    var rangeIsTo = eval(d1.getDate() + "/" + d1.getMonth() + 1) + "/" + d1.getFullYear();

    return rangeIsTo;
};

var dictionarySTK = {
    "lang": {
        "PT": [
            { "Controle": "hrNormal", "Label": "Normal" },
            { "Controle": "hrAditional", "Label": "Adicionais" },
            { "Controle": "hrFault", "Label": "Ausência" },
            { "Controle": "hrAprove", "Label": "Aprovar" },
            { "Controle": "hrNormal", "Label": "Normal" },
            { "Controle": "labelIS", "Label": "IS:" },
            { "Controle": "labelPass", "Label": "Senha:" },
            { "Controle": "loginBtn", "Label": "Login" },
            { "Controle": "labelDateBegin", "Label": "Data Início:" },
            { "Controle": "labelDateEnd", "Label": "Data Final:" },
            { "Controle": "labelHours", "Label": "Hora:" },
            { "Controle": "labelHourNormal", "Label": "Horas Normais" },
            { "Controle": "labelWeek", "Label": "Semana:" },
            { "Controle": "btnAddHours", "Label": "Adicionar" },
            { "Controle": "btnCancelHour", "Label": "Cancelar" },
            { "Controle": "labelProject", "Label": "Projeto:" },
            { "Controle": "labelAcitivity", "Label": "Atividade" },
            { "Controle": "labelDescription", "Label": "Descrição" },
            { "Controle": "labelReplyLanc", "Label": "Replicar Lançamentos" },
            { "Controle": "btnAddNormalHour", "Label": "Salvar" },
            { "Controle": "btnCancelNormalHour", "Label": "Cancelar" },
            { "Controle": "labelHourAditional", "Label": "Horas Adicionais" },
            { "Controle": "btnAddAditionalHours", "Label": "Adicionar" },
            { "Controle": "btnCancelHour", "Label": "Cancelar" },
            { "Controle": "labelDate", "Label": "Data:" },
            { "Controle": "labelHourBegin", "Label": "Hora Entrada:" },
            { "Controle": "btnAddAditionalHour", "Label": "Salvar" },
            { "Controle": "btnCancelAditionalHour", "Label": "Cancelar" },
            { "Controle": "labelTypeDiscount", "Label": "Tipo de Desconto" },
            { "Controle": "btnSaveApprove", "Label": "Gravar" },
            { "Controle": "btnReproveApprove", "Label": "Reprovar" },
            { "Controle": "btnApprove", "Label": "Aprovar" },
            { "Controle": "btnCancelAprove", "Label": "Cancelar" },
            { "Controle": "labelFault", "Label": "Ausência" },
            { "Controle": "btnSaveFaultHours", "Label": "Salvar" },
            { "Controle": "btnCancelFaultHours", "Label": "Cancelar" },
            { "Controle": "label_ISName", "Label": "Nome Colaborador:" },
            { "Controle": "label_Lang", "Label": "Idioma:" },
            { "Controle": "label_Platform", "Label": "Plataforma:" },
            { "Controle": "btnLogoff", "Label": "Logoff" }
        ],
        "EN": [
            {
            }],
        "ES": [
            {
            }]
    }
};

function MountURLWS(operation) {
    //return 'http://intrasoft.softtek.com:8081/wsSRAPDK/cResourceHours.asmx?op=' + operation;
    return 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=' + operation;
}

function GetWeekDay(day) {
    switch (day) {
        case 0: //Sunday
            return 2;
            break;
        case 1: //Monday
            return 3;
            break;
        case 2: //Tuesday
            return 4;
            break;
        case 3: //wed
            return 5;
            break;
        case 4: //thrus
            return 6;
            break;
        case 5: //friday
            return 7;
            break;
        case 6: //saturday
            return 1;
            break;
    }
}