#!/bin/bash
set -euo pipefail

echo "╔══════════════════════════════════════════╗"
echo "║  GymForce - Setup Inicial do VPS         ║"
echo "╚══════════════════════════════════════════╝"

echo ">>> Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

echo ">>> Instalando dependencias..."
sudo apt install -y \
    ca-certificates curl gnupg lsb-release \
    ufw fail2ban git make

echo ">>> Instalando Docker..."
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
    sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

sudo usermod -aG docker $USER

echo ">>> Configurando firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo ">>> Configurando fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

echo ">>> Preparando diretorio..."
sudo mkdir -p /opt/gymforce
sudo chown $USER:$USER /opt/gymforce

echo ""
echo "✅ Setup concluido!"
echo ""
echo "Proximos passos:"
echo "  1. Sair e reconectar (para grupo docker funcionar)"
echo "  2. cd /opt/gymforce"
echo "  3. git clone https://github.com/CalixtoSW/Gymforce.git ."
echo "  4. cp deploy/.env.prod.example deploy/.env.prod"
echo "  5. Editar deploy/.env.prod com credenciais reais"
echo "  6. make -f deploy/Makefile ssl-init"
echo "  7. make -f deploy/Makefile up"
