; CRM Gráfica - Script de Instalação (Inno Setup)
; Compile com: iscc.exe setup.iss

#define MyAppName "CRM Gráfica"
#define MyAppVersion "2.0.0"
#define MyAppPublisher "CRM Gráfica Team"
#define MyAppURL "https://github.com/melgarafael/CRMGrafica"
#define MyAppExeName "node.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName=C:\Program Files\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=
OutputDir=windows-installer
OutputBaseFilename=CRMGráfica-Installer-{#MyAppVersion}
SetupIconFile=
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
CloseApplications=yes
RestartApplications=no

[Languages]
Name: "brazilianportuguese"; MessagesFile: "compiler:Languages\\Portuguese.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce
Name: "firewall"; Description: "Configurar firewall para rede local"; GroupDescription: "Configurações adicionais:"; Flags: checkedonce
Name: "startup"; Description: "Iniciar com o Windows"; GroupDescription: "Opções de inicialização:"; Flags: checkedonce

[Files]
; Aplicação principal
Source: ".next\standalone\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs
Source: ".next\static\*"; DestDir: "{app}\.next\static"; Flags: recursesubdirs createallsubdirs
Source: "public\*"; DestDir: "{app}\public"; Flags: recursesubdirs createallsubdirs
Source: "node_modules\.pnpm\@swc+helpers@*\node_modules\@swc\helpers\**"; DestDir: "{app}\node_modules\.pnpm\@swc+helpers@\node_modules\@swc\helpers"; Flags: recursesubdirs createallsubdirs exemptfiles
; Nota: Paths específicos podem precisar de ajuste conforme estrutura do projeto

; WinSW
Source: "windows-installer\winsw-*.exe"; DestDir: "{app}"; Flags: ignoreversion
Source: "windows-installer\cr*grafica-*.xml"; DestDir: "{app}"; Flags: ignoreversion

; Scripts de instalação
Source: "windows-installer\*.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "windows-installer\*.ps1"; DestDir: "{app}"; Flags: ignoreversion
Source: "windows-installer\*.iss"; DestDir: "{app}"; Flags: ignoreversion

[Code]
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // Configurar firewall se tarefa marcada
    if IsTaskSelected('firewall') then
    begin
      Exec('powershell.exe', '-ExecutionPolicy Bypass -File "' + ExpandConstant('{app}\firewall-allow.ps1') + '"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
    end;
    
    // Criar tarefa agendada para backup diário
    Exec('schtasks.exe', '/create /tn "CRM Grafica Backup" /tr "' + ExpandConstant('{app}\backup-daily.ps1') + '" /sc daily /st 02:00 /ru SYSTEM', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  end;
end;

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\start-app.bat"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\start-app.bat"; Tasks: desktopicon

[Run]
Filename: "{app}\start-app.bat"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent
Filename: "{app}\crm-grafica-app.exe"; Parameters: "install"; Description: "Registrar serviço Windows"; Flags: runhidden postinstall skipifsilent; Tasks: startup
Filename: "{app}\crm-grafica-worker.exe"; Parameters: "install"; Description: "Registrar serviço Worker"; Flags: runhidden postinstall skipifsilent; Tasks: startup
