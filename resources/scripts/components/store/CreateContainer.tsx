import * as Icon from 'react-feather';
import { Form, Formik } from 'formik';
import useFlash from '@/plugins/useFlash';
import { useStoreState } from 'easy-peasy';
import { number, object, string } from 'yup';
import Field from '@/components/elements/Field';
import Select from '@/components/elements/Select';
import { Egg, getEggs } from '@/api/store/getEggs';
import createServer from '@/api/store/createServer';
import Spinner from '@/components/elements/Spinner';
import { getNodes, Node } from '@/api/store/getNodes';
import { getNests, Nest } from '@/api/store/getNests';
import { Button } from '@/components/elements/button';
import InputSpinner from '@/components/elements/InputSpinner';
import StoreError from '@/components/elements/store/StoreError';
import React, { ChangeEvent, useEffect, useState } from 'react';
import TitledGreyBox from '@/components/elements/TitledGreyBox';
import FlashMessageRender from '@/components/FlashMessageRender';
import StoreContainer from '@/components/elements/StoreContainer';
import { getResources, Resources } from '@/api/store/getResources';
import PageContentBlock from '@/components/elements/PageContentBlock';
import {
    faArchive,
    faCube,
    faDatabase,
    faEgg,
    faHdd,
    faLayerGroup,
    faList,
    faMemory,
    faMicrochip,
    faNetworkWired,
    faStickyNote,
} from '@fortawesome/free-solid-svg-icons';

interface CreateValues {
    name: string;
    description: string | null;
    cpu: number;
    memory: number;
    disk: number;
    ports: number;
    backups: number | null;
    databases: number | null;

    egg: number;
    nest: number;
    node: number;
}

export default () => {
    const [loading, setLoading] = useState(false);
    const [resources, setResources] = useState<Resources>();

    const user = useStoreState((state) => state.user.data!);
    const { clearFlashes, clearAndAddHttpError } = useFlash();

    const [egg, setEgg] = useState<number>(0);
    const [eggs, setEggs] = useState<Egg[]>();
    const [nest, setNest] = useState<number>(0);
    const [nests, setNests] = useState<Nest[]>();
    const [node, setNode] = useState<number>(0);
    const [nodes, setNodes] = useState<Node[]>();

    useEffect(() => {
        clearFlashes();

        getResources().then((resources) => setResources(resources));

        getEggs().then((eggs) => setEggs(eggs));
        getNests().then((nests) => setNests(nests));
        getNodes().then((nodes) => setNodes(nodes));
    }, []);

    const changeNest = (e: ChangeEvent<HTMLSelectElement>) => {
        setNest(parseInt(e.target.value));

        getEggs(parseInt(e.target.value)).then((eggs) => {
            setEggs(eggs);
            setEgg(eggs[0].id);
        });
    };

    const submit = (values: CreateValues) => {
        setLoading(true);
        clearFlashes('store:create');

        createServer(values, egg, nest, node)
            .then((data) => {
                if (!data.id) return;

                setLoading(false);
                clearFlashes('store:create');
                // @ts-expect-error this is valid
                window.location = `/server/${data.id}`;
            })
            .catch((error) => {
                setLoading(false);
                clearAndAddHttpError({ key: 'store:create', error });
            });
    };

    if (!resources) return <Spinner size={'large'} centered />;

    if (!nodes) {
        return (
            <StoreError
                message={'No nodes are available for deployment. Try again later.'}
                admin={'Ensure you have at least one node that can be deployed to.'}
            />
        );
    }

    if (!nests || !eggs) {
        return (
            <StoreError
                message={'No server types are available for deployment. Try again later.'}
                admin={'Ensure you have at least one egg which is in a public nest.'}
            />
        );
    }

    return (
        <PageContentBlock title={'Create Server'} showFlashKey={'store:create'}>
            <Formik
                onSubmit={submit}
                initialValues={{
                    name: `${user.username}'s server`,
                    description: 'Write a server description here.',
                    cpu: resources.cpu,
                    memory: resources.memory,
                    disk: resources.disk,
                    ports: resources.ports,
                    backups: resources.backups,
                    databases: resources.databases,
                    nest: 1,
                    egg: 1,
                    node: 1,
                }}
                validationSchema={object().shape({
                    name: string().required().min(3),
                    description: string().optional().min(3).max(191),

                    cpu: number().required().min(25).max(resources.cpu),
                    memory: number().required().min(256).max(resources.memory),
                    disk: number().required().min(256).max(resources.disk),

                    ports: number().required().min(1).max(resources.ports),
                    backups: number().optional().max(resources.backups),
                    databases: number().optional().max(resources.databases),

                    node: number().required().default(node),
                    nest: number().required().default(nest),
                    egg: number().required().default(egg),
                })}
            >
                <Form>
                    <h1 className={'text-5xl'}>基本資料</h1>
                    <h3 className={'text-2xl text-neutral-500'}>設定您新伺服器的基本欄位.</h3>
                    <StoreContainer className={'lg:grid lg:grid-cols-2 my-10 gap-4'}>
                        <TitledGreyBox title={'Server name'} icon={faStickyNote} className={'mt-8 sm:mt-0'}>
                            <Field name={'name'} />
                            <p className={'mt-1 text-xs'}>為您的伺服器設定一個好的名稱.</p>
                            <p className={'mt-1 text-xs text-gray-400'}>
                                字元限制: <code>a-z A-Z 0-9 _ - .</code> and <code>[Space]</code>.
                            </p>
                        </TitledGreyBox>
                        <TitledGreyBox title={'Server description'} icon={faList} className={'mt-8 sm:mt-0'}>
                            <Field name={'description'} />
                            <p className={'mt-1 text-xs'}>為您的伺服器設定一個好的簡介.</p>
                            <p className={'mt-1 text-xs text-yellow-400'}>* 可選</p>
                        </TitledGreyBox>
                    </StoreContainer>
                    <h1 className={'text-5xl'}>資源限制</h1>
                    <h3 className={'text-2xl text-neutral-500'}>設定CPU、RAM等資源的具體數量限制.</h3>
                    <StoreContainer className={'lg:grid lg:grid-cols-3 my-10 gap-4'}>
                        <TitledGreyBox title={'CPU限制'} icon={faMicrochip} className={'mt-8 sm:mt-0'}>
                            <Field name={'cpu'} />
                            <p className={'mt-1 text-xs'}>分配可用CPU的限制</p>
                            <p className={'mt-1 text-xs text-gray-400'}>{resources.cpu}% 於帳號中</p>
                        </TitledGreyBox>
                        <TitledGreyBox title={'記憶體限制'} icon={faMemory} className={'mt-8 sm:mt-0'}>
                            <div className={'relative'}>
                                <Field name={'memory'} />
                                <p className={'absolute text-sm top-1.5 right-2 bg-gray-700 p-2 rounded-lg'}>MB</p>
                            </div>
                            <p className={'mt-1 text-xs'}>分配可用RAM的限制</p>
                            <p className={'mt-1 text-xs text-gray-400'}>{resources.memory}MB available</p>
                        </TitledGreyBox>
                        <TitledGreyBox title={'儲存限制'} icon={faHdd} className={'mt-8 sm:mt-0'}>
                            <div className={'relative'}>
                                <Field name={'disk'} />
                                <p className={'absolute text-sm top-1.5 right-2 bg-gray-700 p-2 rounded-lg'}>MB</p>
                            </div>
                            <p className={'mt-1 text-xs'}>分配可用儲存空間的限制</p>
                            <p className={'mt-1 text-xs text-gray-400'}>{resources.disk}MB 可用的</p>
                        </TitledGreyBox>
                    </StoreContainer>
                    <h1 className={'text-5xl'}>功能限制</h1>
                    <h3 className={'text-2xl text-neutral-500'}>
                        為您的伺服器添加資料庫、分配和連接埠。
                    </h3>
                    <StoreContainer className={'lg:grid lg:grid-cols-3 my-10 gap-4'}>
                        <TitledGreyBox title={'分配'} icon={faNetworkWired} className={'mt-8 sm:mt-0'}>
                            <Field name={'ports'} />
                            <p className={'mt-1 text-xs'}>為您的伺服器分配連接埠數量.</p>
                            <p className={'mt-1 text-xs text-gray-400'}>{resources.ports} 可用的</p>
                        </TitledGreyBox>
                        <TitledGreyBox title={'備份'} icon={faArchive} className={'mt-8 sm:mt-0'}>
                            <Field name={'backups'} />
                            <p className={'mt-1 text-xs'}>為您的伺服器分配備份數量.</p>
                            <p className={'mt-1 text-xs text-gray-400'}>{resources.backups} 可用的</p>
                        </TitledGreyBox>
                        <TitledGreyBox title={'資料庫'} icon={faDatabase} className={'mt-8 sm:mt-0'}>
                            <Field name={'databases'} />
                            <p className={'mt-1 text-xs'}>為您的伺服器分配資料庫數量.</p>
                            <p className={'mt-1 text-xs text-gray-400'}>{resources.databases} 可用的</p>
                        </TitledGreyBox>
                    </StoreContainer>
                    <h1 className={'text-5xl'}>部署</h1>
                    <h3 className={'text-2xl text-neutral-500'}>選擇節點和伺服器類型.</h3>
                    <StoreContainer className={'lg:grid lg:grid-cols-3 my-10 gap-4'}>
                        <TitledGreyBox title={'可用節點'} icon={faLayerGroup} className={'mt-8 sm:mt-0'}>
                            <Select name={'node'} onChange={(e) => setNode(parseInt(e.target.value))}>
                                {!node && <option>選擇節點...</option>}
                                {nodes.map((n) => (
                                    <option key={n.id} value={n.id}>
                                        {n.name} ({n.location}) |{' '}
                                        {100 - parseInt(((n?.used / n?.total) * 100).toFixed(0))}% 可用 | {n.deployFee}{' '}
                                        積分
                                    </option>
                                ))}
                            </Select>
                            <p className={'mt-1 text-xs text-gray-400'}>選擇部署至伺服器的節點.</p>
                        </TitledGreyBox>
                        <TitledGreyBox title={'Nest'} icon={faCube} className={'mt-8 sm:mt-0'}>
                            <Select name={'nest'} onChange={(nest) => changeNest(nest)}>
                                {!nest && <option>選擇一個Nest...</option>}
                                {nests.map((n) => (
                                    <option key={n.id} value={n.id}>
                                        {n.name}
                                    </option>
                                ))}
                            </Select>
                            <p className={'mt-1 text-xs text-gray-400'}>選擇欲用至伺服器的Nest.</p>
                        </TitledGreyBox>
                        <TitledGreyBox title={'Egg'} icon={faEgg} className={'mt-8 sm:mt-0'}>
                            <Select name={'egg'} onChange={(e) => setEgg(parseInt(e.target.value))}>
                                {!egg && <option>選擇Egg...</option>}
                                {eggs.map((e) => (
                                    <option key={e.id} value={e.id}>
                                        {e.name}
                                    </option>
                                ))}
                            </Select>
                            <p className={'mt-1 text-xs text-gray-400'}>
                                選擇您想在您的伺服器上運行的遊戲.
                            </p>
                        </TitledGreyBox>
                    </StoreContainer>
                    <InputSpinner visible={loading}>
                        <FlashMessageRender byKey={'store:create'} className={'my-2'} />
                        <div className={'text-right'}>
                            <Button
                                type={'submit'}
                                className={'w-1/6 mb-4'}
                                size={Button.Sizes.Large}
                                disabled={loading}
                            >
                                <Icon.Server className={'mr-2'} /> 建立
                            </Button>
                        </div>
                    </InputSpinner>
                </Form>
            </Formik>
        </PageContentBlock>
    );
};
