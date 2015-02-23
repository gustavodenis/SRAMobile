var stkApp = function () { }

stkApp.prototype = function () {

    var aLancamentos = [];
    var aLancamentosAditional = [];
    var aAbsence = [];
    var AcitivityFaults = [];
    var Weeks = [];
    var Activities = [];
    var IdSegment = 'BR';
    var langPref = 'pt_br';
    var FuncIS = 'ACFV';
    var FuncName = 'Vidal';
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

        ApplyLangStart();

        if (window.localStorage.getItem("userInfo") != null) {
            _login = true;
            _loadHome(window.localStorage.getItem("userInfo"));
            $.mobile.changePage('#home', { transition: 'flip' });
        }

        $('#btnLogoff').on('click', function () {
            window.localStorage.clear();
            $.mobile.changePage('#logon', { transition: 'flip' });
        });

        $('.loginBtn').on('click', function () {
            if (window.localStorage.getItem("userInfo") === null) {
                var erro = '';
                if ($('#is_stk').val() == '')
                    erro += getMsgLang(langPref, 'ValidIS');
                if ($('#pass_stk').val() == '')
                    erro += getMsgLang(langPref, 'ValidPass');

                if (erro.length > 0) {
                    alert(getMsgLang(langPref, 'ErrorFound') + erro);
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
                            alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
                        });
                    }, getMsgLang(langPref, 'Authenticating'), this);
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

        $(document).on("swiperight", "#listFault li", function (event) {
            var listitem = $(this),
            transition = $.support.cssTransform3d ? "right" : false;
            deleteFault(listitem, transition);
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

            $("#listFault").removeClass("touch");
            $("#listFault li.btnDelF").on("click", function () {
                var listitem = $(this).parent("li");
                deleteFault(listitem);
            });
        }

        $('#hrAprove').on('click', function () {
            fauxAjax(function () {
                var body = '<soap12:Body>';
                body += '<isLeader xmlns="http://tempuri.org/">';
                body += '<strFuncIS>' + FuncIS + '</strFuncIS>';
                body += '</isLeader>';
                body += '</soap12:Body>';
                var envelope = getEnvelope(body);

                $.ajax({
                    type: 'POST',
                    url: MountURLWS('isLeader'),
                    contentType: 'application/soap+xml; charset=utf-8',
                    data: envelope
                })
                .done(function (data) {
                    if (data === '1') {
                        $.mobile.changePage('#approvePage', { transition: 'flip' });
                    }
                    else {
                        $(this).removeClass('ui-btn-active');
                        alert(getMsgLang(langPref, 'PermissionPage'));
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
                });
            }, getMsgLang(langPref, 'Loading'), this);
        });

        $('#btnLangpt, #btnLanges, #btnLangen').on('click', function () {
            changeLang($(this).attr('id').substr(7, 2));
            window.localStorage.setItem("langPreference", $(this).attr('id').substr(7, 2));
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

            var dtnew = Dt.split("/");
            var dtParse = new Date(dtnew[2] + "/" + dtnew[1] + "/" + dtnew[0]);

            var erros = '';
            if (Dt == '')
                erros += getMsgLang(langPref, 'ValidDate');
            if (Hour == '')
                erros += getMsgLang(langPref, 'ValidHour');
            if (Proj == '')
                erros += getMsgLang(langPref, 'ValidProject');
            if (Activity == '')
                erros += getMsgLang(langPref, 'ValidActivity');
            if (Desc == '')
                erros += getMsgLang(langPref, 'ValidDescription');

            if (DtRepBegin.length > 0 && DtRepEnd.length > 0) {
                if (compareDate(DtRepBegin, DtRepEnd)) {
                    var dtrepInew = DtRepBegin.split("/");
                    DtRepBegin = dtrepInew[2] + "/" + dtrepInew[1] + "/" + dtrepInew[0];
                    var dtrepFnew = DtRepEnd.split("/");
                    DtRepEnd = dtrepFnew[2] + "/" + dtrepFnew[1] + "/" + dtrepFnew[0];
                } else {
                    erros += getMsgLang(langPref, 'DateRepInvalid');
                }
            }
            else {
                DtRepBegin = dtnew[2] + "/" + dtnew[1] + "/" + dtnew[0];
                DtRepEnd = dtnew[2] + "/" + dtnew[1] + "/" + dtnew[0];
            }

            if (erros.length > 0)
                alert(getMsgLang(langPref, 'ErrorFound') + erros);
            else {
                var body = '<soap12:Body>';
                body += '<addRecordHoraRecursoMobile xmlns="http://tempuri.org/">';
                body += '<IntYear>' + dtParse.getFullYear() + '</IntYear>';
                body += '<strFuncIS>' + FuncIS + '</strFuncIS>';
                body += '<intWeek>' + dtParse.getWeek() + '</intWeek>';
                body += '<intWeekDay>' + GetWeekDay(dtParse.getDay()) + '</intWeekDay>';
                body += '<intSequencial>' + $('#idSeq').val() + '</intSequencial>';
                body += '<strDescription>' + Desc + '</strDescription>';
                body += '<strActivityCode>' + Activity + '</strActivityCode>';
                body += '<dblHours>' + Hour + '</dblHours>';
                body += '<intMonth>' + (dtParse.getMonth() + 1) + '</intMonth>';
                body += '<intMonthDay>' + dtParse.getDate() + '</intMonthDay>';
                body += '<strAlternativeCode>' + Proj + '</strAlternativeCode>';
                body += '<intCalendarYear>' + dtParse.getFullYear() + '</intCalendarYear>';
                body += '<intAdditionalHour>0</intAdditionalHour>';
                body += '<strCreatedBy>' + FuncIS + '</strCreatedBy>';
                body += '<strHourEnter></strHourEnter>';
                body += '<strSegmentId>' + IdSegment.trim() + '</strSegmentId>';
                body += '<strStartDate>' + DtRepBegin + '</strStartDate>';
                body += '<strEndDate>' + DtRepEnd + '</strEndDate>';
                body += '<strLanguageId>' + langPref + '</strLanguageId>';
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
                    alert((data == 'Sucesso' ? getMsgLang(langPref, 'DataSaveSuccess') : data));
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
                });
            }
        });

        $('#btnAddAditionalHour').on('click', function () {
            var HourBegin = $('#txtHourBegin').val();
            var Dt = $('#txtDtAditional').val();
            var Hour = $('#txtHourAditional').val();
            var Activity = $('#ddlActivityAditional option:selected').val();
            var Desc = $('#txtDescAditional').val();
            var DtRepBegin = $('#txtDtRepAditionalBegin').val();
            var DtReplEnd = $('#txtDtRepAditionalEnd').val();
            var Proj = $('#txtProjAditional').val();
            var Week = $('#ddlWeek option:selected').val();

            var dtnew = Dt.split("/");
            var dtParse = new Date(dtnew[2] + "/" + dtnew[1] + "/" + dtnew[0]);

            var erros = '';
            if (Dt == '')
                erros += getMsgLang(langPref, 'ValidDate');
            if (HourBegin == '')
                erros += getMsgLang(langPref, 'ValidHourEntrance');
            if (Hour == '')
                erros += getMsgLang(langPref, 'ValidHour');
            if (Proj == '')
                erros += getMsgLang(langPref, 'ValidProject');
            if (Activity == '')
                erros += getMsgLang(langPref, 'ValidActivity');
            if (Desc == '')
                erros += getMsgLang(langPref, 'ValidDescription');

            if (DtRepBegin.length > 0 && DtRepEnd.length > 0) {
                if (compareDate(DtRepBegin, DtRepEnd)) {
                    var dtrepInew = DtRepBegin.split("/");
                    DtRepBegin = dtrepInew[2] + "/" + dtrepInew[1] + "/" + dtrepInew[0];
                    var dtrepFnew = DtRepEnd.split("/");
                    DtRepEnd = dtrepFnew[2] + "/" + dtrepFnew[1] + "/" + dtrepFnew[0];
                } else {
                    erros += getMsgLang(langPref, 'DateRepInvalid');
                }
            }
            else {
                DtRepBegin = dtnew[2] + "/" + dtnew[1] + "/" + dtnew[0];
                DtRepEnd = dtnew[2] + "/" + dtnew[1] + "/" + dtnew[0];
            }

            if (erros.length > 0)
                alert(getMsgLang(langPref, 'ErrorFound') + erros);
            else {
                var body = '<soap12:Body>';
                body += '<addRecordHoraRecursoMobile xmlns="http://tempuri.org/">';
                body += '<IntYear>' + dtParse.getFullYear() + '</IntYear>';
                body += '<strFuncIS>' + FuncIS + '</strFuncIS>';
                body += '<intWeek>' + dtParse.getWeek() + '</intWeek>';
                body += '<intWeekDay>' + GetWeekDay(dtParse.getDay()) + '</intWeekDay>';
                body += '<intSequencial>' + $('#idSeq').val() + '</intSequencial>';
                body += '<strDescription>' + Desc + '</strDescription>';
                body += '<strActivityCode>' + Activity + '</strActivityCode>';
                body += '<dblHours>' + Hour + '</dblHours>';
                body += '<intMonth>' + (dtParse.getMonth() + 1) + '</intMonth>';
                body += '<intMonthDay>' + dtParse.getDate() + '</intMonthDay>';
                body += '<strAlternativeCode>' + Proj + '</strAlternativeCode>';
                body += '<intCalendarYear>' + dtParse.getFullYear() + '</intCalendarYear>';
                body += '<intAdditionalHour>1</intAdditionalHour>';
                body += '<strCreatedBy>' + FuncIS + '</strCreatedBy>';
                body += '<strHourEnter>' + HourBegin + '</strHourEnter>';
                body += '<strSegmentId>' + IdSegment.trim() + '</strSegmentId>';
                body += '<strStartDate>' + DtRepBegin + '</strStartDate>';
                body += '<strEndDate>' + DtRepEnd + '</strEndDate>';
                body += '<strLanguageId>' + langPref + '</strLanguageId>';
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
                    alert((data == 'Sucesso' ? getMsgLang(langPref, 'DataSaveSuccess') : data));
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
                });
            }
        });

        $('#btnSaveFaultHours').on('click', function () {
            var DtBegin = $('#txtDtBeginFault').val();
            var DtEnd = $('#txtDtEndFault').val();
            var Hour = $('#txtHourFault').val();
            var Activity = $('#ddlActivityFault option:selected').val();
            var Desc = $('#txtDescFault').val();

            var erros = '';
            if (DtBegin == '')
                erros += getMsgLang(langPref, 'ValidDateBegin');
            if (DtEnd == '')
                erros += getMsgLang(langPref, 'ValidDateEnd');
            if (Hour == '')
                erros += getMsgLang(langPref, 'ValidHour');
            if (Activity == '')
                erros += getMsgLang(langPref, 'ValidActivity');
            if (Desc == '')
                erros += getMsgLang(langPref, 'ValidDescription');

            if (erros.length > 0)
                alert(getMsgLang(langPref, 'ErrorFound') + erros);
            else {
                var body = '<soap12:Body>';
                body += '<setInsertOrderMobile xmlns="http://Stk.org/">';
                body += '<strLanguageId>' + dtParse.getFullYear() + '</strLanguageId>';
                body += '<strFuncIs>' + FuncIS + '</strFuncIs>';
                body += '<strActivityId>' + dtParse.getWeek() + '</strActivityId>';
                body += '<intTypeOfActivity>' + GetWeekDay(dtParse.getDay()) + '</intTypeOfActivity>';
                body += '<dteFromDate>' + $('#idSeq').val() + '</dteFromDate>';
                body += '<dteToDate>' + Desc + '</dteToDate>';
                body += '<decTotalHours>' + Activity + '</decTotalHours>';
                body += '<strOrderDescription>' + Hour + '</strOrderDescription>';
                body += '<intTotalCertificates>' + (dtParse.getMonth() + 1) + '</intTotalCertificates>';
                body += '<strCreatedBy>' + dtParse.getDate() + '</strCreatedBy>';
                body += '<intTypeOfDiscount>' + Proj + '</intTypeOfDiscount>';
                body += '<intOrderStatus>' + dtParse.getFullYear() + '</intOrderStatus>';
                body += '</setInsertOrderMobile>';
                body += '<soap12:Body>';
                var envelope = getEnvelopeAbs(body);

                $.ajax({
                    type: 'POST',
                    url: MountURLSWSAbs('setInsertOrderMobile'),
                    contentType: 'application/soap+xml; charset=utf-8',
                    data: envelope
                })
                .done(function (data) {
                    alert((data > 0 ? getMsgLang(langPref, 'DataSaveSuccess') : getMsgLang(langPref, 'DataSaveError')));
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
                });
            }
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

        $('#btnAddFaultHours').on('click', function () {
            $('#txtDtBeginFault,#txtDtEndFault,#txtHourFault,#txtDescFault').val('');
            $('#ddlActivityFault, #OrderId').val(0);
        });

        $('#btnApprove').on('click', function () {
            $('#listApproveHours li').each(function () {
                if ($(this).attr('IsCertificateRule') == 'true') {
                    alert(getMsgLang(langPref, 'ApproveMass'));
                    return;
                }
            });
            $('#popupApprove').show();
        });

        $('#btnSaveApprove, #btnReproveApprove').on('click', function () {
            var OrderIds = '';
            $('#listApproveHours input[type="checkbox"]:checked').each(function () {
                OrderIds += $(this).val() + ",";
            });
            var body = '<soap12:Body>';
            body += '<setUpdateStatusMobile xmlns="http://Stk.org/">';
            body += '<strLanguageId>' + IdSegment + '</strLanguageId>';
            body += '<OrderIds>' + OrderIds + '</OrderIds>';
            body += '<OrderStatus>' + Status + '</OrderStatus>';
            body += '<OrderDescription>' + Desc + '</OrderDescription>';
            body += '<ApprovalDescription>' + AprDesc + '</ApprovalDescription>';
            body += '<ValidationDescription>' + ValDesc + '</ValidationDescription>';
            body += '<UpdatedBy>' + FuncIS + '</UpdatedBy>';
            body += '<IsCertificate>' + 0 + '</IsCertificate>';
            body += '<TypeOfDiscount>' + ddlTypeDiscount + '</TypeOfDiscount>';
            body += '</setUpdateStatusMobile>';
            body += '<soap12:Body>';
            var envelope = getEnvelopeAbs(body);

            $.ajax({
                type: 'POST',
                url: MountURLSWSAbs('setUpdateStatusMobile'),
                contentType: 'application/soap+xml; charset=utf-8',
                data: envelope
            })
            .done(function (data) {
                alert((data > 0 ? getMsgLang(langPref, 'DataSaveSuccess') : getMsgLang(langPref, 'DataSaveError')));
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
            });
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
        }, getMsgLang(langPref, 'Loading'), this);
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
                alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
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
                alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
            });
        }
        else {
            MountActivityCombo();
        }

        getCollaborator();
    },

    MountWeekCombo = function MountWeekCombo() {
        $('#ddlWeek, #ddlWeekAditional').empty();
        $('#ddlWeek, #ddlWeekAditional').append("<option value='0' selected='selected'>" + getMsgLang(langPref, 'SelCombo') + "</option>");
        $.each(Weeks, function (index, el) {
            $('#ddlWeek, #ddlWeekAditional').append("<option value=" + Weeks[index].WeekNumber + ">" + Weeks[index].WeekNumber + ' - ' + Weeks[index].DateStartWeek + ' - ' + Weeks[index].DateFinishWeek + "</option>");
        });
    },

    MountActivityCombo = function MountActivityCombo() {
        $('#ddlActivity, #ddlActivityAditional').empty();
        $('#ddlActivity, #ddlActivityAditional').append("<option value='0' selected='selected'>" + getMsgLang(langPref, 'SelCombo') + "</option>");
        $.each(Activities, function (index, el) {
            $('#ddlActivity, #ddlActivityAditional').append("<option value=" + Activities[index].value + ">" + Activities[index].value + "</option>");
        });
    },

    DeleteHourAditional = function (listitem, transition) {

        if (listitem.attr('Validado') == 'true') {
            alert(getMsgLang(langPref, 'RegValidated'));
            return;
        }

        listitem.children(".ui-btn").addClass("ui-btn-active");

        if (confirm(getMsgLang(langPref, 'ConfirmDelete'))) {
            fauxAjax(function () {
                var ano, mes, dia, seq;
                seq = listitem.attr('Seq');
                dia = listitem.attr('Dia');
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
                                $("#listAditional").listview("refresh").find(".border-bottom").removeClass("border-bottom");
                            })
                            .prev("li").children("a").addClass("border-bottom")
                            .end().end().children(".ui-btn").removeClass("ui-btn-active");
                        }
                        else {
                            listitem.remove();
                            $("#listAditional").listview("refresh");
                        }
                        LoadAditionalHours($('#ddlWeekAditional option:selected').val());
                    }
                    else {
                        alert(getMsgLang(langPref, 'ErrorDeleteReg'));
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
                });
            }, getMsgLang(langPref, 'Deleting'), this);
        }
        else {
            listitem.children(".ui-btn").removeClass("ui-btn-active");
        }
    },

    DeleteHourNormal = function (listitem, transition) {

        if (listitem.attr('Validado') == 'true') {
            alert(getMsgLang(langPref, 'RegValidated'));
            return;
        }

        listitem.children(".ui-btn").addClass("ui-btn-active");

        if (confirm(getMsgLang(langPref, 'ConfirmDelete'))) {
            fauxAjax(function () {
                var ano, mes, dia, seq;
                seq = listitem.attr('seq');
                dia = listitem.attr('dia');
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
                    if (data == "1") {
                        if (transition) {
                            listitem
                            .addClass(transition)
                            .on("webkitTransitionEnd transitionend otransitionend", function () {
                                listitem.remove();
                                $("#listHours").listview("refresh").find(".border-bottom").removeClass("border-bottom");
                            })
                            .prev("li").children("a").addClass("border-bottom")
                            .end().end().children(".ui-btn").removeClass("ui-btn-active");
                        }
                        else {
                            listitem.remove();
                            $("#listHours").listview("refresh");
                        }

                        LoadNormalHours($('#ddlWeek option:selected').val());
                    }
                    else {
                        alert(getMsgLang(langPref, 'ErrorDeleteReg'));
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
                });
            }, getMsgLang(langPref, 'Deleting'), this);
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
                    console.log(xml);
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
                            'Descricao': $(this).find('Descricao').text().trim(),
                            'Validado': $(this).find('Validado').text().trim()
                        });

                        rows += '<li Seq=' + $(this).find('Sequencial').text().trim() + ' Dia=' + $(this).find('DiaMes').text().trim() + ' Validado=' + $(this).find('Validado').text().trim() + ' class="btnDelHN">';
                        rows += '<a href="#"><h3>' + getDateString($(this).find('DiaMes').text().trim(), $(this).find('Mes').text().trim(), $(this).find('Ano').text().trim()) + '</h3><p class="topic"><strong>';
                        rows += $(this).find('CodigoAlternativo').text().trim() + '</strong> ' + $(this).find('Descricao').text().trim() + '</p><p class="ui-li-aside"><strong>' + parseInt($(this).find('Horas').text()).toString() + getMsgLang(langPref, 'LabelHours') + '</strong> - ' + ($(this).find('Validado').text().trim() == 'true' ? 'Validado' : 'Não Validado') + '</p></a>';
                        rows += '<a href="#" Seq=' + $(this).find('Sequencial').text().trim() + ' Dia=' + $(this).find('DiaMes').text().trim() + ' Validado=' + $(this).find('Validado').text().trim() + ' class="btnEditHN"></a>';
                        rows += '</li>';

                        total += parseFloat($(this).find('Horas').text().replace(':', '.'));
                    });

                    rows += '<li><a href="#"><h3>' + getMsgLang(langPref, 'LabelTotal') + '</h3><p class="ui-li-aside"><strong>' + total.toString() + getMsgLang(langPref, 'LabelHours') + '</strong></p></a></li>'
                    $('#listHours').append(rows);
                    $("#listHours").listview("refresh");

                    $('.btnEditHN').on('click', function () {
                        if ($(this).attr('Validado') == 'true') {
                            alert(getMsgLang(langPref, 'RegValidated'));
                        }
                        else {
                            LoadDataNormalHours($(this).attr('Seq'));
                        }
                    });
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
                });
            }, getMsgLang(langPref, 'Loading'), this);
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

        }, getMsgLang(langPref, 'Loading'), this);
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
                            'Descricao': $(this).find('Descricao').text().trim(),
                            'Validado': $(this).find('Validado').text().trim()
                        });

                        rows += '<li Seq=' + $(this).find('Sequencial').text().trim() + ' Dia=' + $(this).find('DiaMes').text().trim() + ' Validado=' + $(this).find('Validado').text().trim() + ' class="btnDelHA">';
                        rows += '<a href="#"><h3>' + getDateString($(this).find('DiaMes').text().trim(), $(this).find('Mes').text().trim(), $(this).find('Ano').text().trim()) + ' / ' + $(this).find('Entrada').text().trim() + '</h3><p class="topic"><strong>';
                        rows += $(this).find('CodigoAlternativo').text().trim() + '</strong> ' + $(this).find('Descricao').text().trim() + '</p><p class="ui-li-aside"><strong>' + parseInt($(this).find('Horas').text()).toString() + getMsgLang(langPref, 'LabelHours') + '</strong> - ' + ($(this).find('Validado').text().trim() == 'true' ? 'Validado' : 'Não Validado') + '</p></a>';
                        rows += '<a href="#" Seq=' + $(this).find('Sequencial').text().trim() + ' Dia=' + $(this).find('DiaMes').text().trim() + ' Validado=' + $(this).find('Validado').text().trim() + ' class="btnEditHA"></a>';
                        rows += '</li>';

                        total += parseFloat($(this).find('Horas').text().replace(':', '.'));
                    });

                    rows += '<li><a href="#"><h3>' + getMsgLang(langPref, 'LabelTotal') + '</h3><p class="ui-li-aside"><strong>' + total.toString() + getMsgLang(langPref, 'LabelHours') + '</strong></p></a></li>'
                    $('#listAditionalHours').append(rows);
                    $("#listAditionalHours").listview("refresh");

                    $('.btnEditHA').on('click', function () {
                        if ($(this).attr('Validado') == 'true') {
                            alert(getMsgLang(langPref, 'RegValidated'));
                        }
                        else {
                            LoadDataAditionalHours($(this).attr('Seq'));
                        }
                    });
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
                });
            }, getMsgLang(langPref, 'Loading'), this);
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

        }, getMsgLang(langPref, 'Loading'), this);
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
                aAbsence = [];

                $('#listFault').empty();

                $(xml).find('cAbsence').each(function () {
                    rows += '<li OrderId=' + $(this).find('OrderId').text().trim() + ' class="btnDelF"><a href="#">';
                    rows += '<h3>' + FuncIS + ' - ' + FuncName + '</h3>';
                    rows += '<p class="topic"><strong>' + $(this).find('ActivityId').text().trim() + ' - ' + $(this).find('ActivityName').text().trim() + '</strong></p>';
                    rows += '<p>' + $(this).find('TotalHours').text().trim() + getMsgLang(langPref, 'LabelHours') + ' : ' + $(this).find('FromDate').text().trim() + " - " + +$(this).find('ToDate').text().trim() + '</p>';
                    rows += '<p>' + $(this).find('OrderDescription').text().trim() + '</p>';
                    rows += '<p>' + $(this).find('OrderStatus').text().trim() + ' - ' + $(this).find('ApprovedBy').text().trim() + ' - ' + $(this).find('AprovalDate').text().trim() + '</p>';
                    rows += '</a><a href="#" class="btnFaultItem" OrderId=' + $(this).find('OrderId').text().trim() + '></a></li>';
                });

                $('#listFault').append(rows);
                $("#listFault").listview("refresh");

                $('#btnFaultItem').on('click', function () {
                    deleteFault($(this).parent(), $(this).attr('OrderId'));
                });
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
            });
        }, getMsgLang(langPref, 'Loading'), this);
    },

    LoadApproveGrid = function (dtBegin, dtEnd) {
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
                var i = 1;
                $('#listApproveHours').empty();

                $(xml).find('cAbsence').each(function () {
                    rows += '<li OrderId=' + $(this).find('OrderId').text().trim() + ' IsCertificateRule=' + $(this).find('IsCertificateRule').text().trim() + '>';
                    rows += '  <a href="#" style="padding-top: 0px;padding-bottom: 0px;padding-right: 42px;padding-left: 0px;">';
                    rows += '    <label style="border-top-width: 0px;margin-top: 0px;border-bottom-width: 0px;margin-bottom: 0px;border-left-width: 0px;border-right-width: 0px;" data-corners="false">';
                    rows += '        <fieldset data-role="controlgroup">';
                    rows += '            <input id="SelectedSensors_' + i + '__Value" name="SelectedSensors[' + i + '].Value" type="checkbox" value="' + $(this).find('OrderId').text().trim() + '" />';
                    rows += '            <input id="SelectedSensors_' + i + '__Id" name="SelectedSensors[' + i + '].Id" type="hidden" value="' + $(this).find('OrderId').text().trim() + '" />';
                    rows += '            <label for="SelectedSensors_' + i + '__Value" style="border-top-width: 0px;margin-top: 0px;border-bottom-width: 0px;margin-bottom: 0px;border-left-width: 0px;border-right-width: 0px;">';
                    rows += '                <label style="padding:10px 0px 0px 10px;">';
                    rows += '                    <h3>' + FuncIS + ' - ' + FuncName + '</h3>';
                    rows += '                    <p class="topic"><strong>' + $(this).find('ActivityId').text().trim() + ' - ' + $(this).find('ActivityName').text().trim() + '</strong></p>';
                    rows += '                    <p>' + $(this).find('TotalHours').text().trim() + getMsgLang(langPref, 'LabelHours') + ' : ' + $(this).find('FromDate').text().trim() + " - " + +$(this).find('ToDate').text().trim() + '</p>';
                    rows += '                    <p>' + $(this).find('OrderDescription').text().trim() + '</p>';
                    rows += '                    <p>' + getMsgLang(langPref, 'LabelBHour') + $(this).find('TotalBankHours').text().trim() + ', ' + getMsgLang(langPref, 'LabelPVaca') + $(this).find('TotalVacations').text().trim() + ', ' + getMsgLang(langPref, 'LabelAllow') + $(this).find('TotalAllowance').text().trim() + '</p>';
                    rows += '                </label>';
                    rows += '            </label>';
                    rows += '        </fieldset>';
                    rows += '    </label>';
                    rows += '  </a>';
                    rows += '  <a href="#" class="btnApproveItem" OrderId=' + $(this).find('OrderId').text().trim() + '></a>';
                    rows += '</li>';
                    i++;
                });

                $('#listApproveHours').append(rows);
                $("#listApproveHours").listview("refresh");

                $('#btnApproveItem').on('click', function () {
                    $('#popupApprove').show();
                });
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
            });
        }, getMsgLang(langPref, 'Loading'), this);
    },

    _initaditionalAddPage = function () {
    },

    _initnormalAddPage = function () {
    },

    _initfaultAddPage = function () {
        fauxAjax(function () {
            getActivities();
        }, getMsgLang(langPref, 'Loading'), this);
    },

    _initfaultPage = function () {
        var dtA = new Date();
        var dt = new Date();
        dt.setFullYear(dtA.getFullYear(), dtA.getMonth(), 1);
        var dtI = new Date();
        dtI.setDate(dt.getDate() - 7);
        var dtF = new Date(dtA.getFullYear(), dtA.getMonth() + 1, 0);
        LoadFaultGrid(dtI.getFullYear() + "-" + zeroPad(dtI.getMonth() + 1, 2) + "-" + zeroPad(dtI.getDate(), 2), dtF.getFullYear() + "-" + zeroPad(dtF.getMonth() + 1, 2) + "-" + zeroPad(dtF.getDate(), 2));
    },

    _initaditionalPage = function () {
    },

    _initapprovePage = function () {
        getTypeofDiscount();

        var dtA = new Date();
        var dt = new Date();
        dt.setFullYear(dtA.getFullYear(), dtA.getMonth(), 1);
        var dtI = new Date();
        dtI.setDate(dt.getDate() - 7);
        var dtF = new Date(dtA.getFullYear(), dtA.getMonth() + 1, 0);
        LoadApproveGrid(dtI.getFullYear() + "-" + zeroPad(dtI.getMonth() + 1, 2) + "-" + zeroPad(dtI.getDate(), 2), dtF.getFullYear() + "-" + zeroPad(dtF.getMonth() + 1, 2) + "-" + zeroPad(dtF.getDate(), 2));
    },

    _initsettingPage = function () {
    },

    changeLang = function changeLang(lang) {
        if (lang.indexOf("pt") === 0) {
            $(dictionarySTKControls.lang.PT).each(function (i, item) {
                changeLangObj(item.Controle, item.Label);
            });
        }
        else if (lang.indexOf("en") === 0) {
            $(dictionarySTKControls.lang.EN).each(function (i, item) {
                changeLangObj(item.Controle, item.Label);
            });
        }
        else if (lang.indexOf("es") === 0) {
            $(dictionarySTKControls.lang.ES).each(function (i, item) {
                changeLangObj(item.Controle, item.Label);
            });
        }
    },

    getMsgLang = function getMsgLang(lang, IdMsg) {
        var ret = "";
        if (lang.indexOf("pt") === 0) {
            $(dictionarySTKMsg.lang.PT).each(function (i, item) {
                if (item.IdMsg == IdMsg)
                    ret = item.Msg;
            });
        }
        else if (lang.indexOf("en") === 0) {
            $(dictionarySTKMsg.lang.EN).each(function (i, item) {
                if (item.IdMsg == IdMsg)
                    ret = item.Msg;
            });
        }
        else if (lang.indexOf("es") === 0) {
            $(dictionarySTKMsg.lang.ES).each(function (i, item) {
                if (item.IdMsg == IdMsg)
                    ret = item.Msg;
            });
        }
        return ret;
    },

    changeLangObj = function changeLangObj(obj, label) {
        var objLabel = $('#' + obj);
        var tag = $(objLabel).get(0).tagName;
        switch (tag) {
            case "SPAN":
                $(objLabel).html(label);
                break;
            case "A":
                $(objLabel).html(label);
                break;
            case "H3":
                $(objLabel).html(label);
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
        if (window.localStorage.getItem("colabInfo") == null) {
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
                    //TotalBankHours: $(data).find('TotalBankHours').text(),
                    //TotalVacations: $(data).find('TotalVacations').text(),
                    //TotalAllowance: $(data).find('TotalAllowance').text(),
                    //IsCovenant: $(data).find('IsCovenant').text(),
                    TeamLeaderName: $(data).find('TeamLeaderName').text()
                };

                window.localStorage.setItem("colabInfo", JSON.stringify(colabdata));
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
            });
        }
    },

    getActivities = function getActivities() {
        if (AcitivityFaults.length == 0) {
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
            .done(function (xml) {
                $(xml).find('cActivity').each(function () {
                    AcitivityFaults.push({ 'ActivityId': $(this).find('ActivityId').text(), 'Description_BR': $(this).find('Description_BR').text(), 'Description_SP': $(this).find('Description_SP').text(), 'Description_EN': $(this).find('Description_EN').text() });
                });

                MountActivityFaultCombo();
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
            });
        }
        else {
            MountActivityFaultCombo();
        }
    },

    MountActivityFaultCombo = function () {
        $('#ddlActivityFault').empty();
        $('#ddlActivityFault').append("<option value='0' selected='selected'>" + getMsgLang(langPref, 'SelCombo') + "</option>");

        $.each(AcitivityFaults, function (index, el) {
            var desc = '';
            if (IdSegment == 'BR')
                desc = AcitivityFaults[index].Description_BR;
            else if (IdSegment == 'CL' || IdSegment == 'CO' || IdSegment == 'AR')
                desc = AcitivityFaults[index].Description_SP;
            else
                desc = AcitivityFaults[index].Description_EN;

            $('#ddlActivityFault').append("<option value=" + AcitivityFaults[index].ActivityId + ">" + desc + "</option>");
        });
    },

    getTypeofDiscount = function getTypeofDiscount() {
        var body = '<soap12:Body>';
        body += '<getTypeOfDiscount xmlns="http://Stk.org/">';
        body += '</getTypeOfDiscount>';
        body += '</soap12:Body>';
        var envelope = getEnvelopeAbs(body);

        $.ajax({
            type: 'POST',
            url: MountURLSWSAbs('getTypeOfDiscount'),
            contentType: 'application/soap+xml; charset=utf-8',
            data: envelope
        })
        .done(function (data) {
            $('#listtypeDiscount').empty();
            var rows = '<li id="labelTypeDiscount" data-role="list-divider">' + getMsgLang(langPref, 'TypeOfDiscount') + '</li>';

            $(data).find('Table').each(function () {
                var desc = '';
                if (IdSegment == 'BR')
                    desc = $(this).find('descr').text();
                else if (IdSegment == 'CL' || IdSegment == 'CO' || IdSegment == 'AR')
                    desc = $(this).find('descr_sp').text();
                else
                    desc = $(this).find('descr_en').text();

                rows += '<li><a href="#" id=' + $(this).find('value') + '>' + desc + '</a></li>';
            });

            $('#listtypeDiscount').append(rows);
            $('#listtypeDiscount').listview("refresh");
        })
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
        });
    },

    deleteFault = function deleteFault(listitem, orderid) {
        listitem.children(".ui-btn").addClass("ui-btn-active");

        if (confirm(getMsgLang(langPref, 'ConfirmDelete'))) {
            fauxAjax(function () {

                var body = '<soap12:Body>';
                body += '<setDeleteOrderMobile xmlns="http://Stk.org/">';
                body += '<strLanguageId>' + IdSegment + '</strLanguageId>';
                body += '<intOrderId>' + orderid + '</intOrderId>';
                body += '</setDeleteOrderMobile>';
                body += '</soap12:Body>';
                var envelope = getEnvelopeAbs(body);

                $.ajax({
                    type: 'POST',
                    url: MountURLSWSAbs('setDeleteOrderMobile'),
                    contentType: 'application/soap+xml; charset=utf-8',
                    data: envelope
                })
                .done(function (data) {
                    if (data == "true") {

                        if (transition) {
                            listitem
                            .addClass(transition)
                            .on("webkitTransitionEnd transitionend otransitionend", function () {
                                listitem.remove();
                                $("#listFault").listview("refresh").find(".border-bottom").removeClass("border-bottom");
                            })
                            .prev("li").children("a").addClass("border-bottom")
                            .end().end().children(".ui-btn").removeClass("ui-btn-active");
                        }
                        else {
                            listitem.remove();
                            $("#listFault").listview("refresh");
                        }
                    }
                    else {
                        alert(getMsgLang(langPref, 'ErrorDeleteReg'));
                    }
                })
                .fail(function (jqXHR, textStatus, errorThrown) {
                    alert(getMsgLang(langPref, 'ErrorAjax') + textStatus + "," + errorThrown);
                });
            }, getMsgLang(langPref, 'Deleting'), this);
        }
        else {
            listitem.children(".ui-btn").removeClass("ui-btn-active");
        }
    },

    ApplyLangStart = function ApplyLangStart() {
        if (window.localStorage.getItem("langPreference") != null) {
            changeLang(window.localStorage.getItem("langPreference"));
            langPref = window.localStorage.getItem("langPreference");
        }
        else {
            var language = window.navigator.userLanguage || window.navigator.language;
            switch (language) {
                case "en_us":
                    changeLang("en_us");
                    langPref = "en_us";
                    break;
                case "es":
                    changeLang("es");
                    langPref = "es";
                    break;
                case "pt_br":
                    changeLang("pt_br");
                    langPref = "pt_br";
                    break;
                default:
                    changeLang("en_us");
                    langPref = "en_us";
                    break;
            }
        }
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

var dictionarySTKMsg = {
    "lang": {
        "PT": [
            { "IdMsg": "Loading", "Msg": "Carregando..." },
            { "IdMsg": "Deleting", "Msg": "Excluindo..." },
            { "IdMsg": "ErrorFound", "Msg": "Erros econtrados:\n" },
            { "IdMsg": "ErrorAjax", "Msg": "Erro na requisição Web. " },
            { "IdMsg": "ConfirmDelete", "Msg": "Deseja Exluir o item?" },
            { "IdMsg": "ErrorDeleteReg", "Msg": "Erro ao excluir o registro!" },
            { "IdMsg": "PermissionPage", "Msg": "Você não possui permissão para acessar esta página!" },
            { "IdMsg": "Authenticating", "Msg": "Autenticando..." },
            { "IdMsg": "ValidIS", "Msg": "- IS\n" },
            { "IdMsg": "ValidPass", "Msg": "- Senha\n" },
            { "IdMsg": "ValidDate", "Msg": "- Data\n" },
            { "IdMsg": "ValidDateBegin", "Msg": "- Data Inicio\n" },
            { "IdMsg": "ValidDateEnd", "Msg": "- Data Final\n" },
            { "IdMsg": "ValidHour", "Msg": "- Horas\n" },
            { "IdMsg": "ValidProject", "Msg": "- Projeto\n" },
            { "IdMsg": "ValidActivity", "Msg": "- Atividade\n" },
            { "IdMsg": "ValidDescription", "Msg": "- Descrição\n" },
            { "IdMsg": "ValidHourEntrance", "Msg": "- Horas de Entrada\n" },
            { "IdMsg": "DataSaveSuccess", "Msg": "Registro salvo com sucesso!" },
            { "IdMsg": "DataSaveError", "Msg": "Erro ao salvar o registro!" },
            { "IdMsg": "SelCombo", "Msg": "Selecione..." },
            { "IdMsg": "TypeOfDiscount", "Msg": "Tipo de Desconto" },
            { "IdMsg": "LabelHours", "Msg": "Horas" },
            { "IdMsg": "LabelTotal", "Msg": "Total" },
            { "IdMsg": "LabelBHour", "Msg": "B. Horas: " },
            { "IdMsg": "LabelPVaca", "Msg": "P. Férias: " },
            { "IdMsg": "LabelAllow", "Msg": "Abono: " },
            { "IdMsg": "RegValidated", "Msg": "Os Tipo de Atividade devem ser iguais para aprovação em lote!" },
            { "IdMsg": "DateRepInvalid", "Msg": "Data de Replicação inválida!" }
        ],
        "EN": [
            { "IdMsg": "Loading", "Msg": "Loading..." },
            { "IdMsg": "Deleting", "Msg": "Deleting..." },
            { "IdMsg": "ErrorFound", "Msg": "Erros econtrados:\n" },
            { "IdMsg": "ErrorAjax", "Msg": "Web Requisition failed. " },
            { "IdMsg": "ConfirmDelete", "Msg": "Would like delete this item?" },
            { "IdMsg": "ErrorDeleteReg", "Msg": "Error deleting the data!" },
            { "IdMsg": "PermissionPage", "Msg": "You don´t have permission to access this page!" },
            { "IdMsg": "Authenticating", "Msg": "Authenticating..." },
            { "IdMsg": "ValidIS", "Msg": "- IS\n" },
            { "IdMsg": "ValidPass", "Msg": "- Password\n" },
            { "IdMsg": "ValidDate", "Msg": "- Date\n" },
            { "IdMsg": "ValidDateBegin", "Msg": "- Date Begin\n" },
            { "IdMsg": "ValidDateEnd", "Msg": "- Date End\n" },
            { "IdMsg": "ValidHour", "Msg": "- Hours\n" },
            { "IdMsg": "ValidProject", "Msg": "- Project\n" },
            { "IdMsg": "ValidActivity", "Msg": "- Activity\n" },
            { "IdMsg": "ValidDescription", "Msg": "- Description\n" },
            { "IdMsg": "ValidHourEntrance", "Msg": "- Entrance Hours\n" },
            { "IdMsg": "DataSaveSuccess", "Msg": "Data updated!" },
            { "IdMsg": "DataSaveError", "Msg": "Error saving the data!" },
            { "IdMsg": "SelCombo", "Msg": "Select..." },
            { "IdMsg": "TypeOfDiscount", "Msg": "Type of Discount" },
            { "IdMsg": "LabelHours", "Msg": "Hours" },
            { "IdMsg": "LabelTotal", "Msg": "Total" },
            { "IdMsg": "LabelBHour", "Msg": "B. Hours: " },
            { "IdMsg": "LabelPVaca", "Msg": "P. Vaca: " },
            { "IdMsg": "LabelAllow", "Msg": "Allowance: " },
            { "IdMsg": "RegValidated", "Msg": "Record was validate by your Manager!" },
            { "IdMsg": "RegValidated", "Msg": "The activity type must be the same for batch approval!" },
            { "IdMsg": "DateRepInvalid", "Msg": "Replication Date is invalid!" }
        ],
        "ES": [
            { "IdMsg": "Loading", "Msg": "Carregando..." },
            { "IdMsg": "Deleting", "Msg": "Excluindo..." },
            { "IdMsg": "ErrorFound", "Msg": "Erros econtrados:\n" },
            { "IdMsg": "ErrorAjax", "Msg": "Erro na requisição Web. " },
            { "IdMsg": "ConfirmDelete", "Msg": "Deseja Exluir o item?" },
            { "IdMsg": "ErrorDeleteReg", "Msg": "Erro ao excluir o registro!" },
            { "IdMsg": "PermissionPage", "Msg": "Você não possui permissão para acessar esta página!" },
            { "IdMsg": "Authenticating", "Msg": "Autenticando..." },
            { "IdMsg": "ValidIS", "Msg": "- IS\n" },
            { "IdMsg": "ValidPass", "Msg": "- Senha\n" },
            { "IdMsg": "ValidDate", "Msg": "- Data\n" },
            { "IdMsg": "ValidDateBegin", "Msg": "- Data Inicio\n" },
            { "IdMsg": "ValidDateEnd", "Msg": "- Data Final\n" },
            { "IdMsg": "ValidHour", "Msg": "- Horas\n" },
            { "IdMsg": "ValidProject", "Msg": "- Projeto\n" },
            { "IdMsg": "ValidActivity", "Msg": "- Atividade\n" },
            { "IdMsg": "ValidDescription", "Msg": "- Descrição\n" },
            { "IdMsg": "ValidHourEntrance", "Msg": "- Horas de Entrada\n" },
            { "IdMsg": "DataSaveSuccess", "Msg": "Registro salvo com sucesso!" },
            { "IdMsg": "DataSaveError", "Msg": "Erro ao salvar o registro!" },
            { "IdMsg": "SelCombo", "Msg": "Selecione..." },
            { "IdMsg": "TypeOfDiscount", "Msg": "Tipo de Desconto" },
            { "IdMsg": "LabelHours", "Msg": "Horas" },
            { "IdMsg": "LabelTotal", "Msg": "Total" },
            { "IdMsg": "LabelBHour", "Msg": "B. Horas: " },
            { "IdMsg": "LabelPVaca", "Msg": "P. Férias: " },
            { "IdMsg": "LabelAllow", "Msg": "Abono: " },
            { "IdMsg": "RegValidated", "Msg": "Registro ha sido validado por el Gerente!" },
            { "IdMsg": "RegValidated", "Msg": "El tipo de actividad debe ser el mismo para su aprobación por lotes!" },
            { "IdMsg": "DateRepInvalid", "Msg": "El fecha de replicacion es incorreta!" }
        ]
    }
};

var dictionarySTKControls = {
    "lang": {
        "PT": [
            { "Controle": "hrNormal", "Label": "Normal" },
            { "Controle": "hrAditional", "Label": "Adicionais" },
            { "Controle": "hrFault", "Label": "Ausência" },
            { "Controle": "hrAprove", "Label": "Aprovar" },
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
            { "Controle": "hrNormal", "Label": "Normal" },
            { "Controle": "hrAditional", "Label": "Aditional" },
            { "Controle": "hrFault", "Label": "Vacation" },
            { "Controle": "hrAprove", "Label": "Approve" },
            { "Controle": "labelIS", "Label": "IS:" },
            { "Controle": "labelPass", "Label": "Password:" },
            { "Controle": "loginBtn", "Label": "Login" },
            { "Controle": "labelDateBegin", "Label": "Date Begin:" },
            { "Controle": "labelDateEnd", "Label": "Date End:" },
            { "Controle": "labelHours", "Label": "Hour:" },
            { "Controle": "labelHourNormal", "Label": "Hours Normals" },
            { "Controle": "labelWeek", "Label": "Week:" },
            { "Controle": "btnAddHours", "Label": "Add" },
            { "Controle": "btnCancelHour", "Label": "Cancel" },
            { "Controle": "labelProject", "Label": "Project:" },
            { "Controle": "labelAcitivity", "Label": "Activity" },
            { "Controle": "labelDescription", "Label": "Description" },
            { "Controle": "labelReplyLanc", "Label": "Reply Hours" },
            { "Controle": "btnAddNormalHour", "Label": "Save" },
            { "Controle": "btnCancelNormalHour", "Label": "Cancel" },
            { "Controle": "labelHourAditional", "Label": "Aditional Hours" },
            { "Controle": "btnAddAditionalHours", "Label": "Add" },
            { "Controle": "btnCancelHour", "Label": "Cancel" },
            { "Controle": "labelDate", "Label": "Date:" },
            { "Controle": "labelHourBegin", "Label": "Hour Entrance:" },
            { "Controle": "btnAddAditionalHour", "Label": "Save" },
            { "Controle": "btnCancelAditionalHour", "Label": "Cancel" },
            { "Controle": "btnSaveApprove", "Label": "Save" },
            { "Controle": "btnReproveApprove", "Label": "Disapprove" },
            { "Controle": "btnApprove", "Label": "Approve" },
            { "Controle": "btnCancelAprove", "Label": "Cancel" },
            { "Controle": "labelFault", "Label": "Absence" },
            { "Controle": "btnSaveFaultHours", "Label": "Save" },
            { "Controle": "btnCancelFaultHours", "Label": "Cancel" },
            { "Controle": "label_ISName", "Label": "Resource Name:" },
            { "Controle": "label_Lang", "Label": "Language:" },
            { "Controle": "label_Platform", "Label": "Plataform:" },
            { "Controle": "btnLogoff", "Label": "Logoff" }
        ],
        "ES": [
            { "Controle": "hrNormal", "Label": "Normal" },
            { "Controle": "hrAditional", "Label": "Adicional" },
            { "Controle": "hrFault", "Label": "Ausencia" },
            { "Controle": "hrAprove", "Label": "Aprobar" },
            { "Controle": "labelIS", "Label": "IS:" },
            { "Controle": "labelPass", "Label": "Contasenã:" },
            { "Controle": "loginBtn", "Label": "Iniciar sesión" },
            { "Controle": "labelDateBegin", "Label": "Fecha de Inicio:" },
            { "Controle": "labelDateEnd", "Label": "Fecha de Finalización:" },
            { "Controle": "labelHours", "Label": "Hora:" },
            { "Controle": "labelHourNormal", "Label": "Horas Normales" },
            { "Controle": "labelWeek", "Label": "Semana:" },
            { "Controle": "btnAddHours", "Label": "Anãdir" },
            { "Controle": "btnCancelHour", "Label": "Cancelar" },
            { "Controle": "labelProject", "Label": "Proyecto:" },
            { "Controle": "labelAcitivity", "Label": "Actividad" },
            { "Controle": "labelDescription", "Label": "Descripción" },
            { "Controle": "labelReplyLanc", "Label": "Replicar Horas" },
            { "Controle": "btnAddNormalHour", "Label": "Guardar" },
            { "Controle": "btnCancelNormalHour", "Label": "Cancelar" },
            { "Controle": "labelHourAditional", "Label": "Horas Adicionales" },
            { "Controle": "btnAddAditionalHours", "Label": "Anãdir" },
            { "Controle": "btnCancelHour", "Label": "Cancelar" },
            { "Controle": "labelDate", "Label": "Fecha:" },
            { "Controle": "labelHourBegin", "Label": "Hora de llegada:" },
            { "Controle": "btnAddAditionalHour", "Label": "Guardar" },
            { "Controle": "btnCancelAditionalHour", "Label": "Cancelar" },
            { "Controle": "btnSaveApprove", "Label": "Guardar" },
            { "Controle": "btnReproveApprove", "Label": "Disaprobar" },
            { "Controle": "btnApprove", "Label": "Aprobar" },
            { "Controle": "btnCancelAprove", "Label": "Cancelar" },
            { "Controle": "labelFault", "Label": "Ausencia" },
            { "Controle": "btnSaveFaultHours", "Label": "Guardar" },
            { "Controle": "btnCancelFaultHours", "Label": "Cancelar" },
            { "Controle": "label_ISName", "Label": "Nombre Colaborador:" },
            { "Controle": "label_Lang", "Label": "Lengua:" },
            { "Controle": "label_Platform", "Label": "Plataforma:" },
            { "Controle": "btnLogoff", "Label": "Desconectar" }
        ]
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

function TestConnectivity() {
    $.ajax({
        type: "GET",
        url: "http://shopname.myshopify.com/products.json",
        dataType: "json",
        timeout: 5000
    }).done(function (data) {
        onLinePhone = true;
    }).fail(function (jqXHR, textStatus, errorThrown) {
        onLinePhone = false;
    });
}