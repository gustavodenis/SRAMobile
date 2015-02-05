var stkApp = function () { }

stkApp.prototype = function () {

    var erro = '';
    var aLancamentos = [];
    var aLancamentosAditional = [];
    var aAbsence = [];
    var Weeks = [];
    var Activities = [];
    var IdSegment = 'BR';
    var FuncIS = 'ACFV';
    var TeamId = 'DEV';
    var EntityId = '2690702';
    var _login = true, //false para ativar o login;

    run = function () {

        var that = this;
        $('#home').on('pagebeforecreate', $.proxy(_initHome, that));
        $('#home').on('pageshow', $.proxy(_initLoadHome, that));
        $('#normalPage').on('pageshow', $.proxy(_initnormalPage, that));
        $('#aditionalPage').on('pageshow', $.proxy(_initaditionalPage, that));
        $('#approvePage').on('pageshow', $.proxy(_initapprovePage, that));
        $('#faultPage').on('pageshow', $.proxy(_initfaultPage, that));
        $('#faultAddPage').on('pageshow', $.proxy(_initfaultAddPage, that));
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

        $(document).on("swiperight", "#listHours li", function (event) {
            var listitem = $(this),
            transition = $.support.cssTransform3d ? "right" : false;
            DeleteHourNormal(listitem, transition);
        });

        $(document).on("swiperight", "#listAditionalHours li", function (event) {
            var listitem = $(this),
            transition = $.support.cssTransform3d ? "right" : false;
            DeleteHourAditional(listitem, transition);
        });

        if (!$.mobile.support.touch) {
            $("#listHours").removeClass("touch");
            $("#listHours li.btnDelHN").on("click", function () {
                var listitem = $(this).parent("li");
                DeleteHourNormal(listitem);
            });

            $("#listAditionalHours").removeClass("touch");
            $("#listAditionalHours li.btnDelHA").on("click", function () {
                var listitem = $(this).parent("li");
                DeleteHourAditional(listitem);
            });
        }

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
            var dtParse = new Date(Dt);

            var erros = '';
            if (Dt == '')
                erros += '- Data\n';
            if (Hour == '')
                erros += '- Horas\n';
            if (Proj == '')
                erros += '- Projeto\n';
            if (Activity == '')
                erros += '- Atividade\n';
            if (Desc == '')
                erros += '- Descrição\n';

            //var dtValid = checkDateWeek(getFirstDateOfWeek(week), getLastDateOfWeek(week));
            //if(!dtValid)
            //    erros += '- Data Selecionada fora da Semana\n';

            if (erros.length > 0)
                alert('Erros Encontrados:\n' + erros);
            else {
                var body = '<soap12:Body>';
                body += '<addRecordHoraRecursoMobile xmlns="http://tempuri.org/">';
                body += '<IntYear>' + dtParse.getFullYear() + '</IntYear>';
                body += '<strFuncIS>' + FuncIS + '</strFuncIS>';
                //body += '<intWeek>' + Week + '</intWeek>';
                body += '<intWeek>' + dtParse.getWeek() + '</intWeek>';
                body += '<intWeekDay>' + GetWeekDay(dtParse.getDay()) + '</intWeekDay>';
                body += '<intSequencial>' + $('#idSeq').val() + '</intSequencial>';
                body += '<strDescription>' + Desc + '</strDescription>';
                body += '<strActivityCode>' + Activity + '</strActivityCode>';
                //body += '<intOpportunity>0</intOpportunity>';
                //body += '<intDescHoursCode>' + intDescHoursCode + '</intDescHoursCode>';
                body += '<dblHours>' + Hour + '</dblHours>';
                body += '<intMonth>' + (dtParse.getMonth() + 1) + '</intMonth>';
                body += '<intMonthDay>' + dtParse.getDate() + '</intMonthDay>';
                body += '<strAlternativeCode>' + Proj + '</strAlternativeCode>';
                body += '<intCalendarYear>' + dtParse.getFullYear() + '</intCalendarYear>';
                body += '<intAdditionalHour>0</intAdditionalHour>';
                body += '<strCreatedBy>' + FuncIS + '</strCreatedBy>';
                body += '<HourEnter></HourEnter>';
                body += '<segmentId>' + IdSegment.trim() + '</segmentId>';
                body += '</addRecordHoraRecursoMobile>';
                body += '<soap12:Body>';
                var envelope = getEnvelope(body);
                console.log(envelope);

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
                erros += '- Data\n';
            if (HourBegin == '')
                erros += '- Horas de Entrada\n';
            if (Hour == '')
                erros += '- Horas\n';
            if (Proj == '')
                erros += '- Projeto\n';
            if (Activity == '')
                erros += '- Atividade\n';
            if (Desc == '')
                erros += '- Descrição\n';

            if (erros.length > 0)
                alert('Erros Encontrados:\n' + erros);
            else {
                var body = '<soap12:Body>';
                body += '<addRecordHoraRecursoMobile xmlns="http://tempuri.org/">';
                body += '<IntYear>' + dtParse.getFullYear() + '</IntYear>';
                body += '<strFuncIS>' + FuncIS + '</strFuncIS>';
                //body += '<intWeek>' + Week + '</intWeek>';
                body += '<intWeek>' + dtParse.getWeek() + '</intWeek>';
                body += '<intWeekDay>' + GetWeekDay(dtParse.getDay()) + '</intWeekDay>';
                body += '<intSequencial>' + $('#idSeq').val() + '</intSequencial>';
                body += '<strDescription>' + Desc + '</strDescription>';
                body += '<strActivityCode>' + Activity + '</strActivityCode>';
                //body += '<intOpportunity>0</intOpportunity>';
                //body += '<intDescHoursCode>' + intDescHoursCode + '</intDescHoursCode>';
                body += '<dblHours>' + Hour + '</dblHours>';
                body += '<intMonth>' + (dtParse.getMonth() + 1) + '</intMonth>';
                body += '<intMonthDay>' + dtParse.getDate() + '</intMonthDay>';
                body += '<strAlternativeCode>' + Proj + '</strAlternativeCode>';
                body += '<intCalendarYear>' + dtParse.getFullYear() + '</intCalendarYear>';
                body += '<intAdditionalHour>1</intAdditionalHour>';
                body += '<strCreatedBy>' + FuncIS + '</strCreatedBy>';
                body += '<HourEnter>' + HourBegin + '</HourEnter>';
                body += '<segmentId>' + IdSegment.trim() + '</segmentId>';
                body += '</addRecordHoraRecursoMobile>';
                body += '<soap12:Body>';
                var envelope = getEnvelope(body);

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
            $('#divRepLanc').show();
        });

        $('#btnAddAditionalHours').on('click', function () {
            $('#txtHourBegin,#txtDtAditional,#txtHourAditional,#txtDescAditional,#txtDtRepAditionalBegin,#txtDtRepAditionalEnd').val('');
            $('#ddlActivityAditional, #idSeqAditional').val(0);
            $('#divRepLancAditional').show();
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

        //getCollaborator();
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

    DeleteHourAditional = function (listitem, transition) {

        listitem.children(".ui-btn").addClass("ui-btn-active");

        if (confirm('Deseja Exluir o lançamento?')) {
            fauxAjax(function () {
                var ano, mes, dia, seq;
                seq = $(this).attr('Seq');
                dia = $(this).attr('Dia');
                $.each(aLancamentosAditional, function (index, el) {
                    if (seq == aLancamentosAditional[index].Sequencial && dia == aLancamentosAditional[index].DiaMes) {
                        ano = aLancamentosAditional[index].Ano;
                        mes = aLancamentosAditional[index].Mes;
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
                    if (data == "True") {
                        if (transition) {
                            listitem
                            .addClass(transition)
                            .on("webkitTransitionEnd transitionend otransitionend", function () {
                                listitem.remove();
                                $("#list").listview("refresh").find(".border-bottom").removeClass("border-bottom");
                            })
                            .prev("li").children("a").addClass("border-bottom")
                            .end().end().children(".ui-btn").removeClass("ui-btn-active");
                        }
                        else {
                            listitem.remove();
                            $("#list").listview("refresh");
                        }
                        LoadAditionalHours($('#ddlWeekAditional option:selected').val());
                    }
                    else {
                        alert('Erro ao excluir o registro!');
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert("Request failed: " + textStatus + "," + errorThrown);
                });
            }, 'excluindo...', this);
        }
        else {
            listitem.children(".ui-btn").removeClass("ui-btn-active");
        }
    },

    DeleteHourNormal = function (listitem, transition) {

        listitem.children(".ui-btn").addClass("ui-btn-active");

        if (confirm('Deseja Exluir o lançamento?')) {
            fauxAjax(function () {
                var ano, mes, dia, seq;
                seq = $(this).attr('Seq');
                dia = $(this).attr('Dia');
                $.each(aLancamentos, function (index, el) {
                    if (seq == aLancamentos[index].Sequencial && dia == aLancamentos[index].DiaMes) {
                        ano = aLancamentos[index].Ano;
                        mes = aLancamentos[index].Mes;
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
                    if (data == "True") {
                        if (transition) {
                            listitem
                            .addClass(transition)
                            .on("webkitTransitionEnd transitionend otransitionend", function () {
                                listitem.remove();
                                $("#list").listview("refresh").find(".border-bottom").removeClass("border-bottom");
                            })
                            .prev("li").children("a").addClass("border-bottom")
                            .end().end().children(".ui-btn").removeClass("ui-btn-active");
                        }
                        else {
                            listitem.remove();
                            $("#list").listview("refresh");
                        }

                        LoadNormalHours($('#ddlWeek option:selected').val());
                    }
                    else {
                        alert('Erro ao excluir o registro!');
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert("Request failed: " + textStatus + "," + errorThrown);
                });
            }, 'excluindo...', this);
        }
        else {
            listitem.children(".ui-btn").removeClass("ui-btn-active");
        }
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

                        rows += '<li Seq=' + $(this).find('Sequencial').text().trim() + ' Dia=' + $(this).find('DiaMes').text().trim() + ' class="btnDelHN">';
                        rows += '<a href="#"><h3>' + getDateString($(this).find('DiaMes').text().trim(), $(this).find('Mes').text().trim(), $(this).find('Ano').text().trim()) + '</h3><p class="topic"><strong>';
                        rows += $(this).find('CodigoAlternativo').text().trim() + '</strong> ' + $(this).find('Descricao').text().trim() + '</p><p class="ui-li-aside"><strong>' + parseInt($(this).find('Horas').text()).toString() + ' Horas</strong></p></a>';
                        rows += '<a href="#" Seq=' + $(this).find('Sequencial').text().trim() + ' Dia=' + $(this).find('DiaMes').text().trim() + ' class="btnEditHN"></a>';
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

                        rows += '<li Seq=' + $(this).find('Sequencial').text().trim() + ' Dia=' + $(this).find('DiaMes').text().trim() + ' class="btnDelHA">';
                        rows += '<a href="#"><h3>' + getDateString($(this).find('DiaMes').text().trim(), $(this).find('Mes').text().trim(), $(this).find('Ano').text().trim()) + ' / ' + $(this).find('Entrada').text().trim() + '</h3><p class="topic"><strong>';
                        rows += $(this).find('CodigoAlternativo').text().trim() + '</strong> ' + $(this).find('Descricao').text().trim() + '</p><p class="ui-li-aside"><strong>' + parseInt($(this).find('Horas').text()).toString() + ' Horas</strong></p></a>';
                        rows += '<a href="#" Seq=' + $(this).find('Sequencial').text().trim() + ' Dia=' + $(this).find('DiaMes').text().trim() + ' class="btnEditHA"></a>';
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

    LoadFaultGrid = function (dtBegin, dtEnd) {
        fauxAjax(function () {
            var body = '<soap12:Body>';
            body += '<getOrders xmlns="http://Stk.org/">';
            body += '<strFuncIs>' + FuncIS + '</strFuncIs>';
            body += '<strSegmentId>' + IdSegment + '</strSegmentId>';
            body += '<strEntityId>' + EntityId + '</strEntityId>';
            body += '<strTeamId>' + TeamId + '</strTeamId>';
            body += '<strActivityId></strActivityId>';
            body += '<intTypeOfActivity>-1</intTypeOfActivity>';
            body += '<dteFromDate>' + dtBegin + '</dteFromDate>';
            body += '<dteToDate>' + dtEnd + '</dteToDate>';
            body += '<strApproverId></strApproverId>';
            body += '<strValidatorId></strValidatorId>';
            body += '<intOrderSatus>-1</intOrderSatus>';
            body += '<intIsCertificateRule>-1</intIsCertificateRule>';
            body += '<intTypeOfReport>0</intTypeOfReport>';
            body += '</getOrders>';
            body += '</soap12:Body>';
            var envelope = getEnvelopeAbs(body);

            $.ajax({
                type: 'POST',
                url: MountURLSWSAbs('getOrders'),
                contentType: 'application/soap+xml; charset=utf-8',
                data: envelope
            })
            .done(function (xml) {
                var rows = '';
                var total = 0;
                aAbsence = [];

                $('#listFault').empty();

                $(xml).find('cAbsence').each(function () {
                    /*
                    <Orders>
                    OrderId = drAbsence("OrderId")
                    .Activity = New cActivity().getActivity()
                    .FromDate = ValidateNull(drAbsence("FromDate"), Nothing)
                    .ToDate = ValidateNull(drAbsence("ToDate"), "")
                    .TotalHours = CDbl(ValidateNull(drAbsence("TotalHours"), 0))
                    .OrderStatus = CInt(ValidateNull(drAbsence("OrderStatus"), -1))
                    .OrderDescription = drAbsence("OrderDescription").ToString.Trim
                    .ApprovalDescription = drAbsence("ApprovalDescription").ToString.Trim
                    .ValidationDescription = drAbsence("ValidationDescription").ToString.Trim
                    .IsCertificate = drAbsence("IsCertificate")
                    .TypeOfDiscount = CInt(ValidateNull(drAbsence("TypeOfDiscount"), 0))
                    .TotalCertificates = CInt(ValidateNull(drAbsence("TotalCertificates"), 0))
                    .ApprovedBy = drAbsence("ApprovedBy").ToString.Trim
                    .ApprovalDate = ValidateNull(drAbsence("ApprovalDate"), Nothing)
                    .ValidatedBy = drAbsence("ValidatedBy").ToString.Trim
                    .ValidationDate = ValidateNull(drAbsence("ValidationDate"), Nothing)
                    .CreatedBy = drAbsence("CreatedBy").ToString.Trim
                    .CreationDate = ValidateNull(drAbsence("CreationDate"), Nothing)
                    .UpdatedBy = drAbsence("UpdatedBy").ToString.Trim
                    .UpdateDate = ValidateNull(drAbsence("UpdateDate"), Nothing)          
                    </Orders>
                    */
                    aAbsence.push({
                        'FuncIs': $(this).find('FuncIs').text().trim(),
                        'CollaboratorName': $(this).find('CollaboratorName').text().trim(),
                        'EntityLeader': $(this).find('EntityLeader').text().trim(),
                        'TeamLeader': $(this).find('TeamLeader').text().trim(),
                        'IsCovenant': $(this).find('IsCovenant').text().trim(),
                        'TotalBankHours': $(this).find('TotalBankHours').text().trim(),
                        'TotalVacations': $(this).find('TotalVacations').text().trim(),
                        'TotalAllowance': $(this).find('TotalAllowance').text().trim()
                    });

                    rows += '<li Seq=' + $(this).find('Sequencial').text().trim() + '>';
                    rows += '<a href="#"><h3>' + getDateString($(this).find('DiaMes').text().trim(), $(this).find('Mes').text().trim(), $(this).find('Ano').text().trim()) + '</h3><p class="topic"><strong>';
                    rows += $(this).find('CodigoAlternativo').text().trim() + '</strong> ' + $(this).find('Descricao').text().trim() + '</p><p class="ui-li-aside"><strong>' + parseInt($(this).find('Horas').text()).toString() + ' Horas</strong></p></a>';
                    rows += '<a href="#"></a>';
                    rows += '</li>';

                    total += parseFloat($(this).find('Horas').text().replace(':', '.'));
                });

                rows += '<li><a href="#"><h3>Total</h3><p class="ui-li-aside"><strong>' + total.toString() + ' Horas</strong></p></a></li>'
                $('#listFault').append(rows);
                $("#listFault").listview("refresh");
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert("Request failed: " + textStatus + "," + errorThrown);
            });
        }, 'carregando...', this);
    },

    _initaditionalAddPage = function () {
    },

    _initnormalAddPage = function () {
    },

    _initfaultAddPage = function () {
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

    _initfaultPage = function () {
        var dt = new Date();
        LoadFaultGrid("01/" + zeroPad((dt.getMonth() > 1 ? dt.getMonth() - 1 : dt.getMonth()), 2) + "/" + dt.getFullYear(), "31/" + zeroPad(dt.getMonth(), 2) + "/" + dt.getFullYear());
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

    getEnvelopeAbs = function getEnvelopeAbs(xmlBody) {
        var dataXML = '<?xml version="1.0" encoding="utf-8"?>';
        dataXML += '<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">';
        dataXML += '<soap12:Header>';
        dataXML += '<cValidationSoapHeader xmlns="http://Stk.org/">';
        dataXML += '<_devToken>WSPDK11PDK11@@</_devToken>';
        dataXML += '</cValidationSoapHeader>';
        dataXML += '</soap12:Header>';
        dataXML += xmlBody;
        dataXML += '</soap12:Envelope>';
        return dataXML;
    },

    getCollaborator = function getCollaborator() {
        var body = '<soap12:Body>';
        body += '  <getCollaborator xmlns="http://Stk.org/">';
        body += '     <strFuncIs>' + FuncIS + '</strFuncIs>';
        body += '   </getCollaborator>';
        body += '</soap12:Body>';
        var envelope = getEnvelopeAbs(body);

        $.ajax({
            type: 'POST',
            url: MountURLSWSAbs('getCollaborator'),
            contentType: 'application/soap+xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            EntityId = $(data).find('EntityId').text();
            TeamId = $(data).find('TeamId').text();

            var colabdata = {
                EntityId: $(data).find('EntityId').text(),
                TeamId: $(data).find('TeamId').text(),
                EntityLeaderName: $(data).find('EntityLeaderName').text(),
                TotalBankHours: $(data).find('TotalBankHours').text(),
                TotalVacations: $(data).find('TotalVacations').text(),
                TotalAllowance: $(data).find('TotalAllowance').text(),
                IsCovenant: $(data).find('IsCovenant').text(),
                TeamLeaderName: $(data).find('TeamLeaderName').text()
            };

            window.localStorage.setItem("colabInfo", JSON.stringify(colabdata));
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });
    },

    getActivity = function getActivity() {
        var body = '<soap12:Body>';
        body += '  <getActivity xmlns="http://Stk.org/">';
        body += '     <strSegmentId>' + IdSegment + '</strSegmentId>';
        body += '     <strActivityId></strActivityId>';
        body += '     <intTypeOfActivity></intTypeOfActivity>';
        body += '     <strEntityId>' + EntityId + '</strEntityId>';
        body += '     <strTeamId>' + TeamId + '</strTeamId>';
        body += '   </getActivity>';
        body += '</soap12:Body>';
        var envelope = getEnvelopeAbs(body);

        $.ajax({
            type: 'POST',
            url: MountURLSWSAbs('getActivity'),
            contentType: 'application/soap+xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            //montar o combo
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });
    },

    getActivities = function getActivities() {
        var body = '<soap12:Body>';
        body += '<getActivities xmlns="http://Stk.org/">';
        body += '<strSegmentId>' + IdSegment + '</strSegmentId>';
        body += '<strEntityId>' + EntityId + '</strEntityId>';
        body += '<strTeamId>' + TeamId + '</strTeamId>';
        body += '</getActivities>';
        body += '</soap12:Body>';
        var envelope = getEnvelopeAbs(body);

        $.ajax({
            type: 'POST',
            url: MountURLSWSAbs('getActivities'),
            contentType: 'application/soap+xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            //montar ocombo
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert("Request failed: " + textStatus + "," + errorThrown);
        });
    },

    ObtainOpportunity = function ObtainOpportunity(Activity, IpID, FuncIS) {
        var body = '<soap12:Body>';
        body += '<ObtainOpportunity xmlns=\"http://tempuri.org/\">';
        body += '<Activity>' + Activity + '</Activity>';
        body += '<IpID>' + IpID + '</IpID>';
        body += '<FuncIS>' + FuncIS + '</FuncIS>';
        body += '</ObtainOpportunity>';
        body += '</soap12:Body>';
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            url: MountURLWS('ObtainOpportunity'),
            contentType: 'application/soap+xml; charset=utf-8',
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
        var body = '<soap12:Body>';
        body += '<isLeader xmlns="http://tempuri.org/">';
        body += '<strFuncIS>' + funcIS + '</strFuncIS>';
        body += '</isLeader>';
        body += '</soap12:Body>';
        var envelope = getEnvelope(body);
        var returnData;

        $.ajax({
            type: 'POST',
            url: MountURLWS('isLeader'),
            contentType: 'application/soap+xml; charset=utf-8',
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

function checkDateWeek(dt_sel, dt_ini, dt_fim) {
    var dtIni = dt_ini.split("/");
    var dtFim = dt_fim.split("/");
    var dtSel = dt_sel.split("/");

    var dataInicio = parseInt(dtIni[2] + dtIni[1] + dtIni[0]);
    var dataFinal = parseInt(dtFim[2] + dtFim[1] + dtFim[0]);
    var dataSel = parseInt(dtSel[2] + dtSel[1] + dtSel[0]);
    if (dataSel >= dataInicio && dataSel <= dataFinal) {
        return true;
    } else {
        return false;
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

function MountURLSWSAbs(operation) {
    return 'http://172.16.128.71:8028/wsStkiAbsence/cService.asmx?op=' + operation;
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

function isOnline() {
    var networkState = navigator.connection.type;
    if (networkState == Connection.UNKNOWN || networkState == Connection.NONE)
        return false;
    else
        return true;

    //return window.navigator.onLine;
}

function TestConnectivity() {
    $.ajax({
        type: "GET",
        url: "http://shopname.myshopify.com/products.json",
        dataType: "json",
        timeout: 5000
    }).done(function (data) {
        onLinePhone = true;
        alert("jqeury Phone on");
    }).fail(function (jqXHR, textStatus, errorThrown) {
        onLinePhone = false;
        alert("jqeury Phone off");
    });
}
