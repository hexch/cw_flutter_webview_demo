import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'dart:typed_data';
import 'package:path/path.dart' as p;
import 'package:html/parser.dart' show parse;
import 'package:flutter/services.dart' show ByteData, rootBundle;
import 'package:mime/mime.dart';

///InAppLocalhostServer class.
///
///This class allows you to create a simple server on `http://localhost:[port]/` in order to be able to load your assets file on a server. The default [port] value is `8080`.
class InAppServer {
  static const logTag = 'InAppServer';
  HttpServer _server;
  int _port = 8080;

  InAppServer({int port = 8080}) {
    this._port = port;
  }

  ///Starts a server on http://localhost:[port]/.
  ///
  ///**NOTE for iOS**: For the iOS Platform, you need to add the `NSAllowsLocalNetworking` key with `true` in the `Info.plist` file (See [ATS Configuration Basics](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html#//apple_ref/doc/uid/TP40009251-SW35)):
  ///```xml
  ///<key>NSAppTransportSecurity</key>
  ///<dict>
  ///    <key>NSAllowsLocalNetworking</key>
  ///    <true/>
  ///</dict>
  ///```
  ///The `NSAllowsLocalNetworking` key is available since **iOS 10**.
  Future<void> start() async {
    if (this._server != null) {
      throw Exception('Server already started on http://localhost:$_port');
    }

    var completer = new Completer();

    runZoned(() {
      HttpServer.bind('127.0.0.1', _port).then((server) {
        print('Server running on http://localhost:' + _port.toString());

        this._server = server;

        server.listen((HttpRequest request) async {
          var body = List<int>();
          var path = Uri.decodeFull(request.requestedUri.path);
          final currentPath = p.dirname(path);
          _logger('path decoded:$path');
          _logger('currentPath:$currentPath');
          path = (path.startsWith('/')) ? path.substring(1) : path;
          path += (path.endsWith('/')) ? 'index.html' : '';

          try {
            body = (await rootBundle.load(path)).buffer.asUint8List();

            final stringBody = String.fromCharCodes(body);
            //_logger('old body:$stringBody');
            if (path.endsWith('html') &&
                stringBody != null &&
                stringBody.isNotEmpty) {
              final newBody = await _parser(stringBody, currentPath);
              body = Uint8List.fromList(newBody.codeUnits);
              //_logger('new body:$newBody');
            }
          } catch (e) {
            print(e.toString());
            request.response.close();
            return;
          }

          var contentType = ['text', 'html'];
          if (!request.requestedUri.path.endsWith('/') &&
              request.requestedUri.pathSegments.isNotEmpty) {
            var mimeType =
                lookupMimeType(request.requestedUri.path, headerBytes: body);
            if (mimeType != null) {
              contentType = mimeType.split('/');
            }
          }

          request.response.headers.contentType =
              new ContentType(contentType[0], contentType[1], charset: 'utf-8');
          if (contentType[0] == "video" && contentType[1] == "mp4") {
            final mp4Path =
                path.startsWith('/') ? path.substring(1, path.length) : path;
            final ByteData videoData = await rootBundle.load(mp4Path);
            final String base64VideoData =
                base64Encode(Uint8List.view(videoData.buffer));
            // // request.response.
            request.response.add(body);
          } else {
            request.response.add(body);
          }

          request.response.close();
          _logger('contentType:${request.response.headers.contentType} ');
        });

        completer.complete();
      });
    }, onError: (e, stackTrace) => print('Error: $e $stackTrace'));

    return completer.future;
  }

  ///Closes the server.
  Future<void> close() async {
    if (this._server != null) {
      await this._server.close(force: true);
      print('Server running on http://localhost:$_port closed');
      this._server = null;
    }
  }

  final String tempMp4 = 'book/movie/17_1/17_1.mp4';
  String get tempTarget => '<source src="$tempMp4" type=\'video/mp4\'>';
  Future<String> _tempParser(String html) async {
    final ByteData videoData = await rootBundle.load(tempMp4);
    final String base64VideoData =
        base64Encode(Uint8List.view(videoData.buffer));
    final htmlString =
        '<source src="data:video/mp4;charset=utf-8;base64,$base64VideoData">';
    return html.replaceFirst(tempTarget, htmlString);
  }

  Future<String> _parser(String html, String currentPath) async {
    if (html == null || html.isEmpty || !html.contains('video')) {
      return html;
    }

    if (html.contains(tempTarget)) {
      final newHtml = await _tempParser(html);
      _logger('temp#######start');
      _logger(newHtml);
      _logger('temp#######end');
      return newHtml;
    }
    final doc = parse(html);
    final source = doc.getElementsByTagName('source');
    if (source == null || source.isEmpty) {
      return html;
    }

    var lines = html.split('\n');
    if (lines.length <= 0) {
      return html;
    }
    var newHtml = "";
    var sourceIndex = 0;
    for (final l in lines) {
      if (l.contains('source')) {
        final s = source[sourceIndex++].attributes;
        //Todo
        _logger('source found:$s');
        if (s == null || s.containsKey('src')) {
          currentPath = currentPath.startsWith('/')
              ? currentPath.substring(1, currentPath.length)
              : currentPath;
          final filename = currentPath + '/' + s['src'];
          final ByteData videoData = await rootBundle.load(filename);
          final String base64VideoData =
              base64Encode(Uint8List.view(videoData.buffer));
          final htmlString =
              '<source src="data:video/mp4;charset=utf-8;base64,$base64VideoData">';
          newHtml = newHtml + htmlString + '\n';
        }
      } else {
        newHtml = newHtml + l + '\n';
      }
    }
    return newHtml;
  }

  _logger(String msg, [String tag = logTag]) {
    print('$tag $msg');
  }
}
