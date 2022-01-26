#!/bin/sh -x
echo in start.sh
echo SERVER_PORT=${SERVER_PORT}
cd /BinLinux64.Dedicated 
./MultiplayerSampleLauncher_Server +sv_port=$SERVER_PORT +log_RemoteConsoleAllowedAddresses=$CONSOLE_ADDR



