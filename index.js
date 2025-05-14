#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const templates = {
  apiConfig: () => `import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
})

api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
    
    if (token) {
      config.headers.Authorization = \`Bearer \${token}\`
    }
    
    return config
  },
  (error) => Promise.reject(error)
)

export default api`,

  getAll: (resource) => `import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'

const url = \`\${process.env.NEXT_PUBLIC_API_URL}\`

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  
  try {
    const response = await axios.get(\`\${url}/${resource}\`, {
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
    })
    
    return NextResponse.json(response.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: error.message, details: error.response.data },
        { status: error.response.status }
      )
    }
    
    return NextResponse.json(
      { error: 'Falha ao buscar ${resource}' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const body = await request.json()
  
  try {
    const response = await axios.post(\`\${url}/${resource}\`, body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    })
    
    return NextResponse.json(response.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: error.message, details: error.response.data },
        { status: error.response.status }
      )
    }
    
    return NextResponse.json(
      { error: 'Falha ao criar ${resource}' },
      { status: 500 }
    )
  }
}`,

  getById: (resource) => `import axios from 'axios'
import { NextRequest, NextResponse } from 'next/server'
import { RouteParams } from '../types/${resource}'

const url = \`\${process.env.NEXT_PUBLIC_API_URL}\`

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authHeader = request.headers.get('authorization')
  const { id } = params
  
  try {
    const response = await axios.get(\`\${url}/${resource}/\${id}\`, {
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
    })
    
    return NextResponse.json(response.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: error.message, details: error.response.data },
        { status: error.response.status }
      )
    }
    
    return NextResponse.json(
      { error: 'Falha ao buscar ${resource}' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  const authHeader = request.headers.get('authorization')
  const { id } = params
  const body = await request.json()
  
  try {
    const response = await axios.put(\`\${url}/${resource}/\${id}\`, body, {
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
    })
    
    return NextResponse.json(response.data)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: error.message, details: error.response.data },
        { status: error.response.status }
      )
    }
    
    return NextResponse.json(
      { error: 'Falha ao atualizar ${resource}' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const authHeader = request.headers.get('authorization')
  const { id } = params
  
  try {
    await axios.delete(\`\${url}/${resource}/\${id}\`, {
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: error.message, details: error.response.data },
        { status: error.response.status }
      )
    }
    
    return NextResponse.json(
      { error: 'Falha ao excluir ${resource}' },
      { status: 500 }
    )
  }
}`,

  types: (
    resource,
    capitalizedResource
  ) => `export interface ${capitalizedResource} {
  id: string
}

export interface RouteParams {
  params: {
    id: string
  }
}

export type Create${capitalizedResource}Dto = Omit<${capitalizedResource}, 'id'>
export type Update${capitalizedResource}Dto = Partial<${capitalizedResource}>`,

  schemas: (resource, capitalizedResource) => `import { z } from 'zod'

export const ${resource}Schema = z.object({
  id: z.string().optional(),
})

export const create${capitalizedResource}Schema = ${resource}Schema.omit({ id: true })
export const update${capitalizedResource}Schema = ${resource}Schema.partial()`,

  useQuery: (
    resource,
    capitalizedResource
  ) => `import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-toastify'
import { ${capitalizedResource}, Create${capitalizedResource}Dto, Update${capitalizedResource}Dto } from '../types/${resource}'

import { fetch${capitalizedResource}List, fetch${capitalizedResource}ById, create${capitalizedResource}, update${capitalizedResource}, delete${capitalizedResource} } from '../actions/${resource}Actions'

export const use${capitalizedResource}List = () => {
  return useQuery<${capitalizedResource}[]>({
    queryKey: ['${resource}List'],
    queryFn: fetch${capitalizedResource}List
  })
}

export const use${capitalizedResource} = (id: string) => {
  return useQuery<${capitalizedResource}>({
    queryKey: ['${resource}', id],
    queryFn: () => fetch${capitalizedResource}ById(id),
    enabled: !!id
  })
}

export const useCreate${capitalizedResource} = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Create${capitalizedResource}Dto) => create${capitalizedResource}(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${resource}List'] })
      toast.success('${capitalizedResource} criado com sucesso')
    },
    onError: (error) => {
      console.error('Erro ao criar ${resource}:', error)
      toast.error('Falha ao criar ${resource}')
    }
  })
}

export const useUpdate${capitalizedResource} = (id: string) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (data: Update${capitalizedResource}Dto) => update${capitalizedResource}(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${resource}', id] })
      queryClient.invalidateQueries({ queryKey: ['${resource}List'] })
      toast.success('${capitalizedResource} atualizado com sucesso')
    },
    onError: (error) => {
      console.error('Erro ao atualizar ${resource}:', error)
      toast.error('Falha ao atualizar ${resource}')
    }
  })
}

export const useDelete${capitalizedResource} = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => delete${capitalizedResource}(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['${resource}List'] })
      toast.success('${capitalizedResource} excluído com sucesso')
    },
    onError: (error) => {
      console.error('Erro ao excluir ${resource}:', error)
      toast.error('Falha ao excluir ${resource}')
    }
  })
}`,

  actionsWithAxios: (
    resource,
    capitalizedResource
  ) => `import axios from 'axios'
import { ${capitalizedResource}, Create${capitalizedResource}Dto, Update${capitalizedResource}Dto } from '../types/${resource}'

export async function fetch${capitalizedResource}List(): Promise<${capitalizedResource}[]> {
  const response = await axios.get('/api/${resource}')
  return response.data
}

export async function fetch${capitalizedResource}ById(id: string): Promise<${capitalizedResource}> {
  const response = await axios.get(\`/api/${resource}/\${id}\`)
  return response.data
}

export async function create${capitalizedResource}(data: Create${capitalizedResource}Dto): Promise<${capitalizedResource}> {
  const response = await axios.post('/api/${resource}', data, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return response.data
}

export async function update${capitalizedResource}(id: string, data: Update${capitalizedResource}Dto): Promise<${capitalizedResource}> {
  const response = await axios.put(\`/api/${resource}/\${id}\`, data, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
  return response.data
}

export async function delete${capitalizedResource}(id: string): Promise<void> {
  await axios.delete(\`/api/${resource}/\${id}\`)
}`,

  actionsWithApiInstance: (
    resource,
    capitalizedResource
  ) => `import api from '@/src/lib/api'
import { ${capitalizedResource}, Create${capitalizedResource}Dto, Update${capitalizedResource}Dto } from '../types/${resource}'

export async function fetch${capitalizedResource}List(): Promise<${capitalizedResource}[]> {
  const response = await api.get('/${resource}')
  return response.data
}

export async function fetch${capitalizedResource}ById(id: string): Promise<${capitalizedResource}> {
  const response = await api.get(\`/${resource}/\${id}\`)
  return response.data
}

export async function create${capitalizedResource}(data: Create${capitalizedResource}Dto): Promise<${capitalizedResource}> {
  const response = await api.post('/${resource}', data)
  return response.data
}

export async function update${capitalizedResource}(id: string, data: Update${capitalizedResource}Dto): Promise<${capitalizedResource}> {
  const response = await api.put(\`/${resource}/\${id}\`, data)
  return response.data
}

export async function delete${capitalizedResource}(id: string): Promise<void> {
  await api.delete(\`/${resource}/\${id}\`)
}`,
};

const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);
const uncapitalize = (str) => str.charAt(0).toLowerCase() + str.slice(1);
const singularize = (str) => (str.endsWith("s") ? str.slice(0, -1) : str);

const generateResource = (
  resource,
  destDir = "./src",
  useApiInstance = false
) => {
  const singularResource = singularize(resource.toLowerCase());
  const capitalizedResource = capitalize(singularResource);

  console.log(`Gerando CRUD para recurso: ${capitalizedResource}`);

  const apiResourceDir = path.join(destDir, "app", "api", singularResource);

  const directories = [
    apiResourceDir,
    path.join(apiResourceDir, "[id]"),
    path.join(destDir, "app", "api", singularResource, "types"),
    path.join(destDir, "app", "api", singularResource, "schemas"),
    path.join(destDir, "app", "api", singularResource, "hooks"),
    path.join(destDir, "app", "api", singularResource, "actions"),
  ];

  if (useApiInstance) {
    directories.push(path.join(destDir, "lib"));
  }

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Diretório criado: ${dir}`);
    }
  });

  if (useApiInstance) {
    const apiConfigPath = path.join(destDir, "lib", "api.ts");
    fs.writeFileSync(apiConfigPath, templates.apiConfig());
    console.log(`Arquivo criado: ${apiConfigPath}`);
  }

  const actionsTemplate = useApiInstance
    ? templates.actionsWithApiInstance(singularResource, capitalizedResource)
    : templates.actionsWithAxios(singularResource, capitalizedResource);

  const files = [
    {
      path: path.join(apiResourceDir, "route.ts"),
      content: templates.getAll(singularResource),
    },
    {
      path: path.join(apiResourceDir, "[id]", "route.ts"),
      content: templates.getById(singularResource),
    },
    {
      path: path.join(apiResourceDir, "types", `${singularResource}.ts`),
      content: templates.types(singularResource, capitalizedResource),
    },
    {
      path: path.join(
        apiResourceDir,
        "schemas",
        `${singularResource}Schemas.ts`
      ),
      content: templates.schemas(singularResource, capitalizedResource),
    },
    {
      path: path.join(apiResourceDir, "hooks", `use${capitalizedResource}.ts`),
      content: templates.useQuery(singularResource, capitalizedResource),
    },
    {
      path: path.join(
        apiResourceDir,
        "actions",
        `${singularResource}Actions.ts`
      ),
      content: actionsTemplate,
    },
  ];

  files.forEach((file) => {
    fs.writeFileSync(file.path, file.content);
    console.log(`Arquivo criado: ${file.path}`);
  });

  console.log(`\nCRUD para ${capitalizedResource} gerado com sucesso!`);

  if (useApiInstance) {
    console.log(
      `\nInstância do Axios configurada em ${path.join(
        destDir,
        "lib",
        "api.ts"
      )}`
    );
    console.log(`As actions foram configuradas para usar essa instância.`);
  } else {
    console.log(
      `\nAs actions estão usando Axios padrão com headers sendo passados em cada chamada.`
    );
  }
};

const askQuestion = (question, defaultAnswer = "") => {
  return new Promise((resolve) => {
    const defaultText = defaultAnswer ? ` (${defaultAnswer})` : "";
    rl.question(`${question}${defaultText}: `, (answer) => {
      resolve(answer || defaultAnswer);
    });
  });
};

const main = async () => {
  console.log("🚀 usemaru - Gerador de CRUD para Next.js");
  console.log("=====================================\n");

  const resource = await askQuestion(
    "Qual o nome do recurso (ex: users, products)?"
  );
  const destDir = await askQuestion("Diretório de destino", "./src");

  const useApiInstance = await askQuestion(
    "Criar instância configurada do Axios? (s/N)",
    "n"
  );

  const shouldUseApiInstance =
    useApiInstance.toLowerCase() === "s" ||
    useApiInstance.toLowerCase() === "sim";

  generateResource(resource, destDir, shouldUseApiInstance);
  rl.close();
};

main();
