FROM 441218111557.dkr.ecr.us-west-2.amazonaws.com/baseimage:multiarch-py3 AS stk_base

ARG GITHUB_STK
ENV GITHUB_STK=https://github.com/yahavb/stk-code

ARG GITHUB_STK_BRANCH
ENV GITHUB_STK_BRANCH=master

FROM 441218111557.dkr.ecr.us-west-2.amazonaws.com/stk:stk-assets-amd64 AS stk_assets
RUN pwd
RUN ls -ltra

FROM stk_base AS stk_code
COPY --from=1 /stk-assets /stk-assets

RUN git clone https://github.com/yahavb/stk-code stk-code --branch master && \
    cd stk-code && \
    mkdir cmake_build && \
    cmake ../stk-code -B ./cmake_build -DSERVER_ONLY=ON && \
    cd cmake_build && \
    make -j$(nproc) -f ./Makefile install
