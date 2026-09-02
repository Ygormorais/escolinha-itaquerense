@echo off
cd /d "C:\Users\Ygor\projetos\elite\escolinha-itaquerense"
echo ===== %date% %time% =====>> "C:\Users\Ygor\projetos\elite\escolinha-itaquerense\logs\automacoes-operacionais.log"
call npx --yes tsx scripts/run-operational-automations.ts >> "C:\Users\Ygor\projetos\elite\escolinha-itaquerense\logs\automacoes-operacionais.log" 2>&1
