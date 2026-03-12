# 🔑 Como Obter sua FIRECRAWL_API_KEY

O Firecrawl é a ferramenta que dará ao seu CRM a capacidade de "ler" qualquer site sem ser bloqueado. Siga os passos abaixo para obter sua chave gratuita:

---

### **1. Criar sua conta**
1. Acesse o site oficial: [firecrawl.dev](https://www.firecrawl.dev/).
2. Clique no botão **"Get Started"** ou **"Sign Up"**.
3. Você pode criar uma conta rapidamente usando seu **GitHub** ou **Google**.

### **2. Obter a API Key**
1. Após fazer o login, você será redirecionado para o **Dashboard**.
2. No menu lateral ou no centro da tela, procure por **"API Keys"**.
3. Você verá uma chave que começa com `fc-....`.
4. Clique no ícone de copiar para salvar a chave.

### **3. Configurar no seu Projeto**
1. No seu computador, abra o arquivo `.env` que está na raiz do projeto `crm-creative`.
2. Adicione a seguinte linha ao final do arquivo:
   ```env
   FIRECRAWL_API_KEY=fc-sua-chave-aqui
   ```
3. Salve o arquivo.

---

### **💡 Informações Importantes:**
- **Plano Gratuito**: O Firecrawl oferece um plano gratuito generoso (atualmente 500 créditos por mês), o que é excelente para começar e testar com muitas empresas.
- **Por que usar?**: Ele resolve problemas de "Cloudflare" e outros bloqueios que impedem o Gemini de ler o site diretamente.
- **O que ele faz no seu código?**: Ele entra no site, remove toda a "sujeira" (anúncios, menus inúteis) e entrega apenas o texto importante para a IA analisar.

---

### **🚀 Próximo Passo:**
Após salvar a chave no seu `.env`, o CRM passará automaticamente a usar o Firecrawl como "chave mestra" para extrair dados profundos de todas as empresas pesquisadas!