import type {
  CreateExampleParams,
  DeleteExampleParams,
  Example,
  GetExampleParams,
  ListExampleParams,
  UpdateExampleParams,
} from '@/types/examples.types';
import { http } from '@/lib/api/config';
import {
  queryOptions,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';

// 获取所有示例（简化版）
const getExamples = async () => {
  const response = await http.get('examples');

  return response.json<Example[]>();
};

// 获取示例列表（带分页和搜索）
const getExampleList = async (params: ListExampleParams) => {
  return http.get('examples', { searchParams: params }).json<{
    data: Example[];
    total: number;
    page: number;
    limit: number;
  }>();
};

// 简化的示例列表查询选项
export const getExampleListOptions = queryOptions<Example[]>({
  queryKey: ['example-list'],
  queryFn: () => getExamples(),
  staleTime: 1000 * 60 * 5, // 5分钟缓存
});

// 带参数的示例列表查询选项
export const getExampleListWithParamsOptions = (params: ListExampleParams) =>
  queryOptions({
    queryKey: ['example-list', params],
    queryFn: () => getExampleList(params),
    staleTime: 1000 * 60 * 5, // 5分钟缓存
  });

// 获取单个示例
const getExample = async (params: GetExampleParams) => {
  const response = await http.get(`examples/${params.id}`);
  return response.json<Example>();
};

// 单个示例查询选项
export const getExampleOptions = (id: number) =>
  queryOptions({
    queryKey: ['example', id],
    queryFn: () => getExample({ id }),
    staleTime: 1000 * 60 * 5, // 5分钟缓存
    enabled: !!id, // 只有当 id 存在时才执行查询
  });

// 创建示例
const createExample = async (data: CreateExampleParams) => {
  const response = await http.post('examples', {
    json: data,
  });
  return response.json<Example>();
};

// 创建示例的 mutation hook
export const useCreateExample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExample,
    onSuccess: () => {
      // 更新列表缓存
      queryClient.invalidateQueries({ queryKey: ['example-list'] });
    },
    onError: (error) => {
      console.error('创建示例失败:', error);
    },
  });
};

// 更新示例
const updateExample = async (data: UpdateExampleParams) => {
  const response = await http.put(`examples/${data.id}`, {
    json: data,
  });
  return response.json<Example>();
};

// 更新示例的 mutation hook
export const useUpdateExample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExample,
    onSuccess: (updatedExample) => {
      // 更新列表缓存
      queryClient.invalidateQueries({ queryKey: ['example-list'] });

      // 更新单个示例缓存
      queryClient.setQueryData(['example', updatedExample.id], updatedExample);
    },
    onError: (error) => {
      console.error('更新示例失败:', error);
    },
  });
};

// 删除示例
const deleteExample = async (params: DeleteExampleParams) => {
  const response = await http.delete(`examples/${params.id}`);
  return response.json<{ success: boolean; message: string }>();
};

// 删除示例的 mutation hook
export const useDeleteExample = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteExample,
    onSuccess: (_, variables) => {
      // 更新列表缓存
      queryClient.invalidateQueries({ queryKey: ['example-list'] });

      // 移除单个示例缓存
      queryClient.removeQueries({ queryKey: ['example', variables.id] });
    },
    onError: (error) => {
      console.error('删除示例失败:', error);
    },
  });
};

// ============= 乐观更新版本 =============

// 创建示例的乐观更新版本
export const useCreateExampleOptimistic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createExample,
    onMutate: async (newExample) => {
      // 取消任何正在进行的查询
      await queryClient.cancelQueries({ queryKey: ['example-list'] });

      // 获取之前的数据
      const previousExamples = queryClient.getQueryData<Example[]>([
        'example-list',
      ]);

      // 乐观更新 - 添加新示例到列表
      if (previousExamples) {
        const optimisticExample: Example = {
          id: Date.now(), // 临时 ID
          ...newExample,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        queryClient.setQueryData<Example[]>(
          ['example-list'],
          [...previousExamples, optimisticExample]
        );
      }

      // 返回回滚用的上下文
      return { previousExamples };
    },
    onError: (_err, _newExample, context) => {
      // 出错时回滚
      if (context?.previousExamples) {
        queryClient.setQueryData(['example-list'], context.previousExamples);
      }
    },
    onSettled: () => {
      // 最终重新获取数据以确保同步
      queryClient.invalidateQueries({ queryKey: ['example-list'] });
    },
  });
};

// 更新示例的乐观更新版本
export const useUpdateExampleOptimistic = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateExample,
    onMutate: async (updatedExample) => {
      await queryClient.cancelQueries({ queryKey: ['example-list'] });
      await queryClient.cancelQueries({
        queryKey: ['example', updatedExample.id],
      });

      // 保存之前的数据
      const previousList = queryClient.getQueryData<Example[]>([
        'example-list',
      ]);
      const previousExample = queryClient.getQueryData<Example>([
        'example',
        updatedExample.id,
      ]);

      // 乐观更新列表
      if (previousList) {
        const newList = previousList.map((example) =>
          example.id === updatedExample.id
            ? {
                ...example,
                ...updatedExample,
                updatedAt: new Date().toISOString(),
              }
            : example
        );
        queryClient.setQueryData(['example-list'], newList);
      }

      // 乐观更新单个示例
      if (previousExample) {
        queryClient.setQueryData(['example', updatedExample.id], {
          ...previousExample,
          ...updatedExample,
          updatedAt: new Date().toISOString(),
        });
      }

      return { previousList, previousExample };
    },
    onError: (_err, variables, context) => {
      // 回滚更改
      if (context?.previousList) {
        queryClient.setQueryData(['example-list'], context.previousList);
      }
      if (context?.previousExample) {
        queryClient.setQueryData(
          ['example', variables.id],
          context.previousExample
        );
      }
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['example-list'] });
      queryClient.invalidateQueries({ queryKey: ['example', variables.id] });
    },
  });
};
