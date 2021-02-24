$(function() {
        //スマホ版は切り抜き機能のヘルプを非表示
        var _UA = navigator.userAgent;
        var phone_flg = false;
        if(_UA.search('iPhone') > -1 || (_UA.search('Android') > -1 && _UA.search('Mobile') > -1)){
              phone_flg = true;
        }
        if(_UA.search('iPhone') === -1 && _UA.search('iPad') === -1 && _UA.search('Android') === -1 ){
            $("#help-download").css("display","none");
        }


        if(phone_flg === true){
            $(".clip_column").css("display","none");
            $(".pdf_column").css("display","none");
        }
        $(".box0>div").heightLine();
        
        $.ajax({
            type: "GET",
            scriptCharset: "utf-8",
            dataType: "json",
            url: "../../settings/package.json"
        }).done(function(res){
            if(res === null){
                return;
            }
            var ver = res[0];
            if(ver.build){
                $("#version-no").html("ver "+ver.build);
            }
        }).fail(function(data){
    
        });
    
    });
    