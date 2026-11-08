module vertexforge

go 1.24

require github.com/jchv/go-webview2 v0.0.0-20260205173254-56598839c808

replace github.com/jchv/go-webview2 => ./third_party/go-webview2

require (
	github.com/webview/webview_go v0.0.0-20240831120633-6173450d4dd6
	golang.org/x/sys v0.0.0-20210218145245-beda7e5e158e
)

replace github.com/webview/webview_go => ./third_party/webview_go
