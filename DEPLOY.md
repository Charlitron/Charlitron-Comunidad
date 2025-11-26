# 🚀 Instrucciones para Deploy en Vercel

## ✅ Archivos ya configurados:
- ✓ `vercel.json` - Configuración de build
- ✓ `vite.config.ts` - Optimizado para producción
- ✓ `index.html` - Listo para Vite
- ✓ `.gitignore` - Correcto

## 📝 Pasos para deployar:

### 1. **Commit y Push de los cambios**
```bash
git add .
git commit -m "Configuración para Vercel"
git push origin main
```

### 2. **En Vercel Dashboard:**

#### A) Importar el proyecto:
- Ve a https://vercel.com/new
- Importa tu repositorio de GitHub
- Vercel detectará automáticamente que es Vite

#### B) Configurar Variables de Entorno:
En **Settings → Environment Variables**, agrega:

```
GEMINI_API_KEY = tu_gemini_api_key
SUPABASE_URL = https://sxqwlqjobbhktqrnavec.supabase.co
SUPABASE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4cXdscWpvYmJoa3Rxcm5hdmVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwNjY0OTgsImV4cCI6MjA3OTY0MjQ5OH0.SfLn70dGil4xtQ0nWL22xAa2bkZO-4yK3GmilElt8yA
```

⚠️ **IMPORTANTE:** Asegúrate de agregar estas variables ANTES del primer deploy.

#### C) Deploy:
- Click en "Deploy"
- Vercel automáticamente ejecutará `npm install` y `npm run build`
- En 2-3 minutos tu app estará lista

### 3. **Verificar el Deploy:**
- Vercel te dará una URL como: `https://tu-proyecto.vercel.app`
- La app debería cargar completamente
- Las APIs de Supabase deberían funcionar

## 🔧 Comandos útiles:

```bash
# Probar el build localmente
npm run build

# Preview del build
npm run preview

# Desarrollo local
npm run dev
```

## 📦 Lo que se arregló:

1. ✅ Eliminado `importmap` de AI Studio
2. ✅ Configurado `vercel.json` con el framework correcto
3. ✅ Añadidas variables de entorno en `vite.config.ts`
4. ✅ Optimizado el build con code splitting
5. ✅ `index.html` ahora usa Vite correctamente

## 🆘 Si algo falla:

1. Revisa los logs en Vercel Dashboard → Deployments
2. Verifica que las variables de entorno estén bien escritas
3. Asegúrate que el repo esté en sync con GitHub

---

**¡Listo hermano!** 🎉 Ahora solo haz el commit y push, y despliega en Vercel.
