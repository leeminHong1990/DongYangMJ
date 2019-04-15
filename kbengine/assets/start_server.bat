@echo off
set curpath=%~dp0

cd ..
set KBE_ROOT=%cd%
set KBE_RES_PATH=%KBE_ROOT%/kbe/res/;%curpath%/;%curpath%/scripts/;%curpath%/res/
set KBE_BIN_PATH=%KBE_ROOT%/kbe/bin/server/
set UID=19760938

cd %curpath%
call "kill_server.bat"

echo KBE_ROOT = %KBE_ROOT%
echo KBE_RES_PATH = %KBE_RES_PATH%
echo KBE_BIN_PATH = %KBE_BIN_PATH%
echo UID = %UID%

start %KBE_BIN_PATH%/machine.exe --cid=107055 --gus=1
start %KBE_BIN_PATH%/logger.exe --cid=207055 --gus=2
start %KBE_BIN_PATH%/interfaces.exe --cid=307055 --gus=3
start %KBE_BIN_PATH%/dbmgr.exe --cid=407055 --gus=4
start %KBE_BIN_PATH%/baseappmgr.exe --cid=507055 --gus=5
start %KBE_BIN_PATH%/cellappmgr.exe --cid=607055 --gus=6
start %KBE_BIN_PATH%/baseapp.exe --cid=707055 --gus=7
@rem start %KBE_BIN_PATH%/baseapp.exe --cid=707055 --gus=8 --hide=1
start %KBE_BIN_PATH%/cellapp.exe --cid=807055 --gus=9
@rem start %KBE_BIN_PATH%/cellapp.exe --cid=807055  --gus=10 --hide=1
start %KBE_BIN_PATH%/loginapp.exe --cid=907055 --gus=11