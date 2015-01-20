jQuery.support.cors = true;
$.ajaxSetup({
    cache: false
});

$(function () {
    $.mobile.defaultHomeScroll = 0;
});

// To debug code on page load in Ripple or on Android devices/emulators: launch your app, set breakpoints, 
// and then run "window.location.reload()" in the JavaScript Console.
(function () {
    "use strict";
    document.addEventListener('deviceready', onDeviceReady.bind(this), false);

    function onDeviceReady() {
        document.addEventListener('pause', onPause.bind(this), false);
        document.addEventListener('resume', onResume.bind(this), false);
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

    var userPoints = {};
    var erro = '';
    var _login = false,

    run = function () {

        var that = this;
        $('#home').on('pagebeforecreate', $.proxy(_initHome, that));
        //$('#pointsDetail').on('pageshow', $.proxy(_initpointsDetail, that));
        //$('#infoSession').on('pageshow', $.proxy(_initinfoSession, that));
        //$('#agendaPage').on('pageshow', $.proxy(_initagendaPage, that));
        //$('#luluPage').on('pageshow', $.proxy(_initluluPage, that));
        //$('#lulurankPage').on('pageshow', $.proxy(_initlulurankPage, that));
        //$('#fulldataPage').on('pageshow', $.proxy(_initfulldataPage, that));

        if (window.localStorage.getItem("userInfo") != null) {
            _login = true;
            _loadHome(JSON.parse(window.localStorage.getItem("userInfo")));
            $.mobile.changePage('#home', { transition: 'flip' });
        }

        $('.loginBtn').click(function () {
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
                        var dataXML = '<?xml version="1.0" encoding="utf-8"?>';
                        dataXML += '<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">';
                        dataXML += '  <soap:Header>';
                        dataXML += '    <ValidationSoapHeader xmlns="http://tempuri.org/">';
                        dataXML += '      <_devToken>WSPDK11PDK11@@</_devToken>';
                        dataXML += '    </ValidationSoapHeader>';
                        dataXML += '  </soap:Header>';
                        dataXML += '  <soap:Body>';
                        dataXML += '    <getColabInfo xmlns="http://tempuri.org/">';
                        dataXML += '      <strFuncIS>MFCS</strFuncIS>';
                        dataXML += '    </getColabInfo>';
                        dataXML += '  </soap:Body>';
                        dataXML += '</soap:Envelope>';

                        $.ajax({
                            type: 'POST',
                            //url: 'http://intrasoft.softtek.com:8081/wsSRAPDK/cResourceHours.asmx/getColabInfo',
                            url: 'http://172.16.128.71:8028/wsSRAPDK/cResourceHours.asmx?op=getColabInfo',
                            contentType: 'text/xml; charset=utf-8',
                            data: dataXML
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

        $("#listHours li").on("swipeleft swiperight", function (event) {
            var listitem = $(this),
                dir = event.type === "swipeleft" ? "left" : "right",
                transition = $.support.cssTransform3d ? dir : false;
            if (confirm('Deseja Exluir o lançamento?'))
            {
                $("#listHours").listview("refresh");
                alert('hehe touch!');
            }
        });

        $('#fulldataBtn').click(function () {
            erro = '';
            if ($('#tfirstname').val() == '')
                erro += '- Primeiro Nome\n';
            if ($('#tlastname').val() == '')
                erro += '- Último Nome\n';
            if ($('#temployer').val() == '')
                erro += '- Empresa\n';
            if ($('#temail').val() == '')
                erro += '- Email\n';
            if ($('#position').val() == '')
                erro += '- Cargo\n';
            if ($('#city').val() == '')
                erro += '- Cidade\n';
            if ($('#state option:selected').val() == '0')
                erro += '- Estado\n';
            if ($('#sector option:selected').val() == '0')
                erro += '- Setor\n';
            if ($('#billing option:selected').val() == '0')
                erro += '- Faturamento';

            if (erro.length > 0) {
                alert('Erros encontrados: ' + erro);
            }
            else {
                fauxAjax(function () {
                    var iidUser = JSON.parse(window.localStorage.getItem("userInfo")).idUser;
                    var dataUser = {
                        idUser: iidUser,
                        firstname: $('#tfirstname').val(),
                        lastname: $('#tlastname').val(),
                        employer: $('#temployer').val(),
                        email: $('#temail').val(),
                        position: $('#position').val(),
                        city: $('#city').val(),
                        state: $('#state  option:selected').val(),
                        sector: $('#sector  option:selected').val(),
                        billing: $('#billing  option:selected').val(),
                        customerSAP: ($('#customerSAP').is(":checked") ? "1" : "0")
                    };

                    window.localStorage.setItem("userInfo", JSON.stringify(dataUser));

                    $.post("http://ec2-54-200-107-211.us-west-2.compute.amazonaws.com/odata/User", dataUser)
                     .done(function (data) {
                         alert("Dados salvo com sucesso!");
                         _loadHome(data);
                         $.mobile.changePage('#home', { transition: 'flip' });
                     })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        alert("Request failed: " + textStatus + "," + errorThrown);
                    });
                }, 'gravando...', this);
            }
        });

        $('#okAgenda').click(function () {
            erro = '';
            if ($('#tel').val() == '')
                erro += '- Telefone\n';
            if ($('#detail').val() == '')
                erro += '- Necessidade\n';

            if (erro.length > 0) {
                alert('Erros encontrados: ' + erro);
            }
            else {
                fauxAjax(function () {
                    var iidUser = JSON.parse(window.localStorage.getItem("userInfo")).idUser;
                    var agendadata = {
                        idUser: iidUser,
                        tel: $('#tel').val(),
                        detail: $('#detail').val()
                    };
                    $.post("http://ec2-54-200-107-211.us-west-2.compute.amazonaws.com/odata/Agenda", agendadata)
                    .done(function (data) {
                        alert('Agenda salva com suscesso!');
                        window.localStorage.setItem("agenda", "ok");
                        $.mobile.changePage('#home', { transition: 'flip' });
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        alert("Request failed: " + textStatus + "," + errorThrown);
                    });
                }, 'gravando...', this);
            }
        });

        $('#savelulu').click(function () {
            erro = '';
            if ($('#standLuluCombo option:selected').val() == '0')
                erro += '- Stand\n';

            if (erro.length > 0) {
                alert('Erros encontrados: ' + erro);
            }
            else {
                fauxAjax(function () {
                    var iidUser = JSON.parse(window.localStorage.getItem("userInfo")).idUser;
                    var luludata = {
                        idStand: $('#standLuluCombo option:selected').val(),
                        idUser: iidUser,
                        question1: ($('#question1').is(":checked") ? "1" : "0"),
                        question2: ($('#question2').is(":checked") ? "1" : "0"),
                        question3: ($('#question3').is(":checked") ? "1" : "0"),
                        question4: ($('#question4').is(":checked") ? "1" : "0"),
                        question5: ($('#question5').is(":checked") ? "1" : "0"),
                        question6: "0"
                    };
                    $.post("http://ec2-54-200-107-211.us-west-2.compute.amazonaws.com/api/Lulu", luludata)
                    .done(function (data) {
                        window.localStorage.setItem("luluOK", "ok");
                        $.mobile.changePage('#lulurankPage', { transition: 'flip' });
                    })
                    .fail(function (jqXHR, textStatus, errorThrown) {
                        alert("Request failed: " + textStatus + "," + errorThrown);
                    });
                }, 'gravando registros...', this);
            }
        });

        $('#okdisclamer').click(function () {
            if ($('#notDisclamer').is(":checked"))
                window.localStorage.setItem("disclamer", "ok");
        });
    },

    _initpointsDetail = function () {
        $('#pointsDetail-cadastro, #pointsDetail-completo, #pointsDetail-infosession, #pointsDetail-stand, #pointsDetail-5info').text('');
        $('#pointsDetail-lulu, #pointsDetail-agenda, #pointsDetail-demo, #pointsDetail-totalpoints').text('');

        fauxAjax(function () {
            var iidUser = JSON.parse(window.localStorage.getItem("userInfo")).idUser;
            $.getJSON("http://ec2-54-200-107-211.us-west-2.compute.amazonaws.com/odata/Point(" + iidUser + ")")
            .done(function (data) {
                var cadastro = 0,
                    completo = 0,
                    infosession = 0,
                    stand = 0,
                    fiveinfo = 0,
                    lulu = 0,
                    agenda = 0,
                    demo = 0,
                    total = 0;

                for (var i in data.value) {
                    switch (data.value[i].typeAction) {
                        case 'Cadastro':
                            cadastro = 5;
                            total = total + 5;
                            break;
                        case 'Dados Completo':
                            completo = 10;
                            total = total + 10;
                            break;
                        case 'InfoSession':
                            infosession = 15;
                            total = total + 15;
                            break;
                        case 'Stand':
                            stand = 10;
                            total = total + 10;
                            break;
                        case 'FirstInfoSession':
                            fiveinfo = 25;
                            total = total + 25;
                            break;
                        case 'Quiz':
                            lulu += 15;
                            total = total + 15;
                            break;
                        case 'Agendamento de Visita':
                            agenda = 25;
                            total = total + 25;
                            break;
                        case 'Demo':
                            demo = 15;
                            total = total + 15;
                            break;
                    }
                }

                $('#pointsDetail-cadastro').text(cadastro);
                $('#pointsDetail-completo').text(completo);
                $('#pointsDetail-infosession').text(infosession);
                $('#pointsDetail-stand').text(stand);
                $('#pointsDetail-5info').text(fiveinfo);
                $('#pointsDetail-lulu').text(lulu);
                $('#pointsDetail-agenda').text(agenda);
                $('#pointsDetail-demo').text(demo);
                $('#pointsDetail-totalpoints').text(total);
            })
            .fail(function (jqxhr, textStatus, error) {
                alert("Get Points error: " + textStatus + ", " + error);
            });
        }, 'carregando...', this);
    },

    _initinfoSession = function () {
    },

    _initHome = function () {
        if (!_login) {
            $.mobile.changePage("#logon", { transition: "flip" });
        }
    },

    _initfulldataPage = function () {
        var dataUser = JSON.parse(window.localStorage.getItem("userInfo"));
        $('#tfirstname').val(dataUser.firstname);
        $('#tlastname').val(dataUser.lastname);
        $('#temployer').val(dataUser.employer);
        $('#temail').val(dataUser.email);

        if (dataUser.position === null) {
            $('#position').val('');
            $('#city').val('');
            $('#state').val('0');
            $('#sector').val('0');
            $('#billing').val('0');
            $('#customerSAP').prop('checked', false);
            $('#fulldataForm select').selectmenu('refresh', true);
        }
        else {
            $('#position').val(dataUser.position);
            $('#city').val(dataUser.city);
            $('#state').val(dataUser.state);
            $('#sector').val(dataUser.sector);
            $('#billing').val(dataUser.billing);
            $('#fulldataForm select').selectmenu('refresh', true);
            $('#customerSAP').prop('checked', (dataUser.customerSAP == '1'));
        }
    },

    _loadHome = function (userInfo) {
        fauxAjax(function () {
            if (window.localStorage.getItem("disclamer") === null)
                $.mobile.changePage('#disclamer', { transition: 'flip' });
            else
                $.mobile.changePage('#home', { transition: 'flip' });
        }, 'carregando...', this);
    },

    _initagendaPage = function () {

        $('#tel').val('');
        $('#detail').val('');

        if (window.localStorage.getItem("agenda") === null)
            $.mobile.changePage('#agendaPage', { transition: 'flip' });
        else {
            $.mobile.changePage('#home', { transition: 'flip' });
            alert('Obrigado por já ter marcado uma agenda!');
        }
    },

    _initluluPage = function () {
        if (window.localStorage.getItem("luluOK") === null) {
            _LoadLuluCombo();
        }
        else {
            if (confirm('Deseja avaliar outro stand?'))
                _LoadLuluCombo();
            else
                $.mobile.changePage('#home', { transition: 'flip' });
        }
    },

    _LoadLuluCombo = function () {
        $('#question1,#question2,#question3,#question4,#question5').prop('checked', false).checkboxradio('refresh');
        $('#standLuluCombo').empty();
        $('#standLuluCombo').append("<option value='0' selected='selected'>Selecione...</option>");

        var lululist = {
            "odata.metadata": "http://ec2-54-200-107-211.us-west-2.compute.amazonaws.com/odata/$metadata#Stand", "value": [
              {
                  "idStand": 30, "dsStand": "Softtek"
              }, {
                  "idStand": 31, "dsStand": "Uol Diveo"
              }, {
                  "idStand": 32, "dsStand": "Sonda"
              }, {
                  "idStand": 33, "dsStand": "Computer Associates"
              }, {
                  "idStand": 34, "dsStand": "T-Systems"
              }, {
                  "idStand": 35, "dsStand": "Deloitte"
              }, {
                  "idStand": 36, "dsStand": "IBM"
              }, {
                  "idStand": 37, "dsStand": "pwc"
              }, {
                  "idStand": 38, "dsStand": "Cisco"
              }, {
                  "idStand": 39, "dsStand": "CSC"
              }, {
                  "idStand": 40, "dsStand": "Algar Tech"
              }, {
                  "idStand": 41, "dsStand": "HP / Intel"
              }, {
                  "idStand": 42, "dsStand": "Capgemini"
              }, {
                  "idStand": 43, "dsStand": "Bradesco"
              }, {
                  "idStand": 44, "dsStand": "American Express"
              }, {
                  "idStand": 45, "dsStand": "Sigga"
              }, {
                  "idStand": 46, "dsStand": "Neoris"
              }, {
                  "idStand": 47, "dsStand": "Indra"
              }, {
                  "idStand": 48, "dsStand": "FH"
              }, {
                  "idStand": 49, "dsStand": "Pelissari"
              }, {
                  "idStand": 50, "dsStand": "Resource"
              }, {
                  "idStand": 51, "dsStand": "Tivit"
              }, {
                  "idStand": 52, "dsStand": "Thomson Reuters"
              }, {
                  "idStand": 53, "dsStand": "its Group"
              }, {
                  "idStand": 54, "dsStand": "Synchro"
              }, {
                  "idStand": 55, "dsStand": "Thera"
              }, {
                  "idStand": 56, "dsStand": "megawork"
              }, {
                  "idStand": 57, "dsStand": "Vistex"
              }, {
                  "idStand": 58, "dsStand": "ENGdb"
              }, {
                  "idStand": 59, "dsStand": "essence"
              }, {
                  "idStand": 60, "dsStand": "Grupo Meta"
              }, {
                  "idStand": 61, "dsStand": "nsi"
              }, {
                  "idStand": 62, "dsStand": "first decision"
              }, {
                  "idStand": 63, "dsStand": "Asug"
              }, {
                  "idStand": 64, "dsStand": "Esperansap"
              }, {
                  "idStand": 65, "dsStand": "gA"
              }, {
                  "idStand": 66, "dsStand": "ITeam"
              }, {
                  "idStand": 67, "dsStand": "Runge Pincock Minarco"
              }, {
                  "idStand": 68, "dsStand": "Hitachi"
              }, {
                  "idStand": 69, "dsStand": "OI"
              }, {
                  "idStand": 70, "dsStand": "SEP"
              }, {
                  "idStand": 71, "dsStand": "Intelligenza"
              }, {
                  "idStand": 72, "dsStand": "LKM"
              }, {
                  "idStand": 73, "dsStand": "WinShuttle"
              }, {
                  "idStand": 74, "dsStand": "Extend"
              }, {
                  "idStand": 75, "dsStand": "Hybris Software"
              }, {
                  "idStand": 76, "dsStand": "SSI"
              }, {
                  "idStand": 77, "dsStand": "NMS"
              }, {
                  "idStand": 78, "dsStand": "Ramo"
              }, {
                  "idStand": 79, "dsStand": "ebs"
              }, {
                  "idStand": 80, "dsStand": "superabiz"
              }, {
                  "idStand": 81, "dsStand": "exxis"
              }, {
                  "idStand": 82, "dsStand": "HB Brasil"
              }, {
                  "idStand": 83, "dsStand": "Ipj"
              }, {
                  "idStand": 84, "dsStand": "training"
              }, {
                  "idStand": 85, "dsStand": "Ti Fontoura"
              }, {
                  "idStand": 86, "dsStand": "gplux"
              }, {
                  "idStand": 87, "dsStand": "KNOA"
              }, {
                  "idStand": 88, "dsStand": "Carta Capital"
              }, {
                  "idStand": 89, "dsStand": "Canal Energia"
              }, {
                  "idStand": 90, "dsStand": "Radio Bandeirantes"
              }, {
                  "idStand": 91, "dsStand": "Jornal Casa"
              }, {
                  "idStand": 92, "dsStand": "ANEFAC"
              }, {
                  "idStand": 93, "dsStand": "MJV"
              }, {
                  "idStand": 94, "dsStand": "GOL"
              }
            ]
        };

        for (var ln in lululist.value) {
            $('#standLuluCombo').append("<option value='" + lululist.value[ln].idStand + "'>" + lululist.value[ln].dsStand + "</option>");
        }

        $('#standLuluCombo').selectmenu('refresh', true);

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
    },

    _initlulurankPage = function () {
        $('#myRankListView li').remove();

        fauxAjax(function () {
            $.getJSON("http://ec2-54-200-107-211.us-west-2.compute.amazonaws.com/api/Lulu")
            .done(function (data) {
                var q = 1;
                for (var ln in data) {
                    if (q == 1)
                        $('#myRankListView').append("<li class='ui-li-has-thumb' id='" + data[ln].idStand + "'><a href='#' class='ui-btn ui-icon-carat-r'><img src='images/trofeu.png'><p>" + data[ln].dsStand + "</p></a></li>");
                    else
                        $('#myRankListView').append("<li class='ui-li-has-thumb' id='" + data[ln].idStand + "'><a href='#' class='ui-btn ui-icon-carat-r'><img src='images/trofeu2.png'><p>" + data[ln].dsStand + "</p></a></li>");
                    q++;
                }
            })
            .fail(function (jqxhr, textStatus, error) {
                alert("Request Failed: " + textStatus + ", " + error);
            });
        }, 'carregando...', this);
    },

    _savePoints = function _savePoints(actionType) {
        if (actionType != '' && window.localStorage.getItem(actionType) === null) {
            var iidUser = JSON.parse(window.localStorage.getItem("userInfo")).idUser;
            var postdata = { idUser: iidUser, typeAction: actionType };
            $.post("http://ec2-54-200-107-211.us-west-2.compute.amazonaws.com/odata/Point", postdata)
            .done(function (data) {
                window.localStorage.setItem(actionType, "ok");
                alert("Pontuação salva!");
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert("Save Points error: " + textStatus + "," + errorThrown);
            });
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