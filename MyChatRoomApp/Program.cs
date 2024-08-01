using System.Collections.Concurrent;
using System.Net;
using System.Net.WebSockets;
using System.Text;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseWebSockets();  // Using WebSocket in our Application
app.UseHttpsRedirection();
app.UseStaticFiles();
 

// To keep track of connected WebSocket clients
var clients = new ConcurrentDictionary<string, WebSocket>();

app.MapGet("/ws", async context => // mapping websocket requests
{
    if (context.WebSockets.IsWebSocketRequest)  // if request is a websocket request
    {
        using var ws = await context.WebSockets.AcceptWebSocketAsync(); // accepts an incoming WebSocket connection as an asynchronous operation.This method upgrades the current HTTP connection to a WebSocket connection
        var clientId = Guid.NewGuid().ToString(); // genrating guid
        clients[clientId] = ws;     // assigning websocket instance to that client GUID

        await SendMessageAsync(ws, "You are connected!"); // sending msg of connected to user

        var buffer = new byte[1024 * 4];  
        var result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None); // storing responce in buffer

        while (!result.CloseStatus.HasValue)
        {
            var message = Encoding.UTF8.GetString(buffer, 0, result.Count);

            // Broadcast the received message to all clients
            foreach (var client in clients)
            {
                if (client.Value.State == WebSocketState.Open)
                {
                    await SendMessageAsync(client.Value, message);
                }
            }

            result = await ws.ReceiveAsync(new ArraySegment<byte>(buffer), CancellationToken.None);

        }
        clients.TryRemove(clientId, out _);
        await ws.CloseAsync(result.CloseStatus.Value, result.CloseStatusDescription, CancellationToken.None);
    }
    else  // if request is not a websocket request
    {
        context.Response.StatusCode = (int)HttpStatusCode.BadRequest; // send bad request 
    }
});

async Task SendMessageAsync(WebSocket ws, string message)
{
    var bytes = Encoding.UTF8.GetBytes(message);
    var arraySegment = new ArraySegment<byte>(bytes, 0, bytes.Length);
    await ws.SendAsync(arraySegment, WebSocketMessageType.Text, true, CancellationToken.None);
}

app.Run();
